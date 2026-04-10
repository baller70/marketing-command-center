"use client"

import { Check, Loader2, Circle } from "lucide-react"
import { MARKETING_STAGES } from "@/lib/pipeline-stages"

interface StageProgressProps {
  currentStage: number
  status: string
  logs?: { stage: number; stageName: string; action: string; details: string | null; createdAt: string }[]
  compact?: boolean
}

export default function StageProgress({ currentStage, status, logs = [], compact = false }: StageProgressProps) {
  const isCompleted = status === "completed"
  const isRejected = status === "rejected"

  return (
    <div className={compact ? "flex items-center gap-1" : "space-y-1"}>
      {compact ? (
        // Horizontal dots for card view
        MARKETING_STAGES.map(stage => {
          const done = stage.num < currentStage || isCompleted
          const active = stage.num === currentStage && !isCompleted
          return (
            <div
              key={stage.num}
              className={`w-2 h-2 rounded-full transition-all ${
                done
                  ? "bg-emerald-500"
                  : active
                    ? "bg-blue-500 animate-pulse"
                    : "bg-[var(--border)]"
              }`}
              title={`${stage.name}${done ? " (done)" : active ? " (current)" : ""}`}
            />
          )
        })
      ) : (
        // Vertical timeline for detail view
        MARKETING_STAGES.map(stage => {
          const done = stage.num < currentStage || isCompleted
          const active = stage.num === currentStage && !isCompleted
          const logEntry = logs.find(l => l.stage === stage.num)
          const rejected = isRejected && stage.num === currentStage

          return (
            <div key={stage.num} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? "bg-emerald-500/20 text-emerald-400"
                      : active
                        ? "bg-blue-500/20 text-blue-400"
                        : rejected
                          ? "bg-red-500/20 text-red-400"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
                {stage.num < 12 && (
                  <div
                    className={`w-0.5 h-4 ${done ? "bg-emerald-500/40" : "bg-[var(--border)]"}`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      done
                        ? "text-emerald-400"
                        : active
                          ? "text-blue-400"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    {stage.num}. {stage.name}
                  </span>
                  {active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      Current
                    </span>
                  )}
                </div>
                {logEntry?.details && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                    {logEntry.details}
                  </p>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
