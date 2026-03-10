import { NextRequest, NextResponse } from "next/server"
import { mautic } from "@/lib/integrations/mautic"
import { novu } from "@/lib/integrations/novu"

export const dynamic = "force-dynamic"

interface LeadHandoff {
  email: string
  firstName?: string
  lastName?: string
  brand: string
  scoreTier: string
  scoreTotal: number
  source: string
  tags?: string[]
}

const BRAND_SEGMENT_IDS: Record<string, number> = {
  tbf: 1,
  ra1: 2,
}

/**
 * POST /api/leads/ingest — Receives qualified leads from Acquisition CC
 * and pushes them into Mautic with the correct brand segment.
 */
export async function POST(req: NextRequest) {
  try {
    const body: LeadHandoff = await req.json()

    if (!body.email || !body.brand) {
      return NextResponse.json({ error: "email and brand are required" }, { status: 400 })
    }

    const tags = [
      `brand:${body.brand}`,
      `tier:${body.scoreTier}`,
      `source:${body.source || "acquisition"}`,
      ...(body.tags || []),
    ]

    const contact = await mautic.createContact({
      email: body.email,
      firstname: body.firstName,
      lastname: body.lastName,
      tags,
    })

    const contactId = contact?.id || (contact as any)?.contact?.id
    const segmentId = BRAND_SEGMENT_IDS[body.brand.toLowerCase()]

    if (contactId && segmentId) {
      await mautic.addContactToSegment(segmentId, contactId)
    }

    console.log(
      `[lead-ingest] ${body.email} → Mautic (brand=${body.brand}, tier=${body.scoreTier}, score=${body.scoreTotal})`
    )

    novu.notifyLeadQualified({
      email: body.email,
      brand: body.brand,
      tier: body.scoreTier,
      score: body.scoreTotal,
    }).catch(() => {})

    return NextResponse.json({
      received: true,
      mauticContactId: contactId,
      segment: segmentId ? body.brand : "none",
    })
  } catch (err: any) {
    console.error("[lead-ingest] Error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
