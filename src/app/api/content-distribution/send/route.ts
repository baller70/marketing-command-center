export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { finalizeEmailSend } from "@/lib/send-batch"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const batchId = typeof body.batchId === "string" ? body.batchId.trim() : ""

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 })
    }

    const batch = await prisma.contentBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true },
    })

    if (!batch) {
      return NextResponse.json({ error: "batch not found" }, { status: 404 })
    }

    const allowed = ["filling", "ready", "failed"].includes(batch.status)
    if (!allowed) {
      return NextResponse.json(
        { error: `cannot send batch in status "${batch.status}"` },
        { status: 400 },
      )
    }

    await prisma.contentBatch.update({
      where: { id: batchId },
      data: { status: "approved", approvedAt: new Date() },
    })

    try {
      const sent = await finalizeEmailSend(batchId)
      return NextResponse.json({ success: true, batch: sent })
    } catch (e: unknown) {
      await prisma.contentBatch.update({
        where: { id: batchId },
        data: { status: "failed" },
      })
      throw e
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[content-distribution/send] POST:", msg)
    const status = msg.includes("not found") ? 404 :
      msg.includes("missing BrandEmailConfig") || msg.includes("batch has no") || msg.includes("cannot send") ? 400 :
      502
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
