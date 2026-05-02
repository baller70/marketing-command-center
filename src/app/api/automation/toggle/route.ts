export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  AUTOMATION_MASTER_KEY,
  AUTOMATION_FEATURE_ROWS,
  type AutomationFeatureCamel,
  type AutomationFeaturesState,
  automationDbKey,
} from "@/lib/automation-config"

const PIPELINE_LAST_CRON_KEY = "pipeline-last-cron-run"

function blankFeatures(): AutomationFeaturesState {
  return Object.fromEntries(
    AUTOMATION_FEATURE_ROWS.map((r) => [r.camel, true]),
  ) as AutomationFeaturesState
}

function normalizeFeatureEnabled(storedValue: string | undefined): boolean {
  if (storedValue === undefined) return true
  return storedValue === "true"
}

function featuresFromRows(settingsMap: Map<string, string>): AutomationFeaturesState {
  const base = blankFeatures()
  for (const row of AUTOMATION_FEATURE_ROWS) {
    const k = automationDbKey(row.dbSuffix)
    const v = settingsMap.get(k)
    base[row.camel] = normalizeFeatureEnabled(v)
  }
  return base
}

async function fetchToggleResponse() {
  const [automationRecords, cronRecord] = await Promise.all([
    prisma.setting.findMany({
      where: { key: { startsWith: "automation-" } },
      select: { key: true, value: true },
    }),
    prisma.setting.findUnique({
      where: { key: PIPELINE_LAST_CRON_KEY },
      select: { value: true },
    }).catch(() => null),
  ])

  const settingsMap = new Map(automationRecords.map((r) => [r.key, r.value]))
  const master = settingsMap.get(AUTOMATION_MASTER_KEY) === "true"

  return {
    master,
    features: featuresFromRows(settingsMap),
    lastCronRun: cronRecord?.value ?? null,
    pendingApprovals: 0,
  }
}

export async function GET() {
  try {
    const data = await fetchToggleResponse()
    return NextResponse.json(data)
  } catch (e) {
    console.error("[automation/toggle GET]", e)
    return NextResponse.json({ error: (e as Error).message ?? "Internal error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const raw = await request.json().catch(() => null)
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const body = raw as { master?: boolean; features?: Partial<Record<AutomationFeatureCamel, boolean>> }

    if (typeof body.master === "boolean") {
      await prisma.setting.upsert({
        where: { key: AUTOMATION_MASTER_KEY },
        update: { value: body.master ? "true" : "false" },
        create: { key: AUTOMATION_MASTER_KEY, value: body.master ? "true" : "false" },
      })
    }

    if (body.features && typeof body.features === "object") {
      for (const row of AUTOMATION_FEATURE_ROWS) {
        const v = body.features[row.camel]
        if (typeof v !== "boolean") continue
        const key = automationDbKey(row.dbSuffix)
        await prisma.setting.upsert({
          where: { key },
          update: { value: v ? "true" : "false" },
          create: { key, value: v ? "true" : "false" },
        })
      }
    }

    const data = await fetchToggleResponse()
    return NextResponse.json(data)
  } catch (e) {
    console.error("[automation/toggle PUT]", e)
    return NextResponse.json({ error: (e as Error).message ?? "Internal error" }, { status: 500 })
  }
}
