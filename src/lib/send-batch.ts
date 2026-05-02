import { prisma } from "@/lib/prisma"
import { mautic } from "@/lib/integrations/mautic"
import { novu } from "@/lib/integrations/novu"
import { renderBatchEmail, type ContentBufferItem } from "@/lib/content-templates"

function mauticEmailIdFromCreate(res: unknown): number | null {
  if (!res || typeof res !== "object") return null
  const o = res as Record<string, unknown>
  const inner = o.email
  if (inner && typeof inner === "object") {
    const id = (inner as Record<string, unknown>).id
    if (typeof id === "number" && Number.isFinite(id)) return id
    if (typeof id === "string") {
      const n = Number(id)
      return Number.isFinite(n) ? n : null
    }
  }
  return null
}

export async function finalizeEmailSend(batchId: string) {
  const batch = await prisma.contentBatch.findUnique({
    where: { id: batchId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  })
  if (!batch) throw new Error("batch not found")
  if (batch.items.length === 0) throw new Error("batch has no items")

  const brandConfig = await prisma.brandEmailConfig.findUnique({
    where: { brand: batch.brand },
  })
  if (!brandConfig) throw new Error(`missing BrandEmailConfig for ${batch.brand}`)

  const items: ContentBufferItem[] = batch.items.map((i) => ({
    id: i.id,
    contentType: i.contentType,
    title: i.title,
    brand: i.brand,
    sourceId: i.sourceId,
    sourceUrl: i.sourceUrl,
    thumbnail: i.thumbnail,
    contentBody: i.contentBody,
    metadata: i.metadata ?? {},
  }))

  const templateHtml = batch.templateHtml || renderBatchEmail(items, batch.contentType, brandConfig)
  const subject = `${batch.brand} — ${batch.contentType} digest`

  await prisma.contentBatch.update({
    where: { id: batch.id },
    data: { templateHtml },
  })

  const name = `${batch.brand}-${batch.contentType}-${batch.id}-${Date.now()}`
  const created = await mautic.createEmail({
    name,
    subject,
    body: templateHtml,
  })
  const mauticEmailId = mauticEmailIdFromCreate(created)
  if (mauticEmailId == null) {
    throw new Error("could not resolve Mautic email id from createEmail response")
  }

  const now = new Date()

  await prisma.$transaction([
    prisma.contentBatch.update({
      where: { id: batch.id },
      data: {
        mauticEmailId,
        status: "sent",
        sentAt: now,
      },
    }),
    prisma.contentBuffer.updateMany({
      where: { batchId: batch.id },
      data: { status: "sent" },
    }),
    prisma.emailAnalytics.create({
      data: {
        batchId: batch.id,
        mauticEmailId,
        brand: batch.brand,
        contentType: batch.contentType,
        subject,
        sentAt: now,
      },
    }),
  ])

  await novu.notify("mautic_email_sent", {
    title: `Email created in Mautic (${batch.brand})`,
    message: `${batch.contentType}: ${subject} (${batch.items.length} items)`,
    brand: batch.brand,
    details: { batchId: batch.id, mauticEmailId },
  }).catch(() => {})

  return prisma.contentBatch.findUnique({
    where: { id: batch.id },
    include: { items: true },
  })
}
