"use client"

import { Battery } from "lucide-react"
import { cn } from "@/lib/utils"

interface BatteryHealthProps {
  soc: number
  soh: number
}

export function BatteryHealth({
  soc,
  soh,
}: BatteryHealthProps) {

  const socStatus =
    soc < 20
      ? "critical"
      : soc < 40
        ? "warning"
        : "ok"

  return (
    <div className="border border-border bg-card p-4">

      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Battery Status
      </h3>

      <div className="flex items-center gap-4">

        <div className="relative h-24 w-16 border-2 border-current">

          <div className="absolute left-0 right-0 top-[-6px] mx-auto h-2 w-6 bg-current" />

          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 transition-all",
              socStatus === "ok"
                ? "bg-secondary"
                : socStatus === "warning"
                  ? "bg-chart-4"
                  : "bg-destructive",
            )}
            style={{ height: `${soc}%` }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-lg font-bold text-foreground">
              {soc}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-4">

          <div className="flex items-center gap-2 text-xs">
            <Battery className="h-4 w-4 text-secondary" />

            <span className="text-muted-foreground">
              State of Charge
            </span>

            <span className="ml-auto font-mono font-bold">
              {soc}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Battery className="h-4 w-4 text-accent" />

            <span className="text-muted-foreground">
              State of Health
            </span>

            <span className="ml-auto font-mono font-bold">
              {soh}%
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}