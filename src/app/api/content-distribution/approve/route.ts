export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { finalizeEmailSend } from "@/lib/send-batch"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const batchId = typeof body.batchId === "string" ? body.batchId.trim() : ""
    const action = body.action === "schedule" ? "schedule" : body.action === "send" ? "send" : ""

    if (!batchId || !action) {
      return NextResponse.json(
        { error: "batchId and action (send|schedule) required" },
        { status: 400 },
      )
    }

    const batch = await prisma.contentBatch.findUnique({
      where: { id: batchId },
      include: { items: true },
    })

    if (!batch) {
      return NextResponse.json({ error: "batch not found" }, { status: 404 })
    }

    if (!["ready", "failed"].includes(batch.status)) {
      return NextResponse.json(
        { error: `batch must be ready or failed to approve (current: ${batch.status})` },
        { status: 400 },
      )
    }

    const now = new Date()

    if (action === "schedule") {
      const raw = typeof body.scheduledFor === "string" ? body.scheduledFor.trim() : ""
      if (!raw) {
        return NextResponse.json({ error: "scheduledFor required for schedule action" }, { status: 400 })
      }
      const scheduledFor = new Date(raw)
      if (Number.isNaN(scheduledFor.getTime())) {
        return NextResponse.json({ error: "invalid scheduledFor date" }, { status: 400 })
      }

      await prisma.contentBatch.update({
        where: { id: batchId },
        data: { status: "scheduled", scheduledFor, approvedAt: now },
      })

      const fresh = await prisma.contentBatch.findUnique({
        where: { id: batchId },
        include: { items: true },
      })
      return NextResponse.json({ success: true, batch: fresh })
    }

    await prisma.contentBatch.update({
      where: { id: batchId },
      data: { status: "approved", approvedAt: now },
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
    console.error("[content-distribution/approve] POST:", msg)
    const status = msg.includes("not found") ? 404 :
      msg.includes("missing BrandEmailConfig") || msg.includes("batch has no") || msg.includes("batch must be") ? 400 :
      502
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
