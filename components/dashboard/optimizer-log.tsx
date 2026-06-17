"use client"

import { Battery, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BatteryData {
  soc?: number
  soh?: number
  voltage?: number
}

interface OptimizerLogProps {
  batteryData?: BatteryData
}

export function OptimizerLog({
  batteryData,
}: OptimizerLogProps) {

  const soc = batteryData?.soc || 0
  const soh = batteryData?.soh || 0
  const voltage = batteryData?.voltage || 0

  const socStatus =
    soc < 20
      ? "critical"
      : soc < 40
        ? "warning"
        : "ok"

  return (
    <div className="border border-border bg-card">

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Battery className="h-4 w-4 text-secondary" />

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Battery Status
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">

        {/* SOC */}
        <div className="border border-border bg-background/50 p-3">

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase text-muted-foreground">
              State Of Charge
            </span>

            <span
              className={cn(
                "text-xs font-bold",
                socStatus === "ok"
                  ? "text-secondary"
                  : socStatus === "warning"
                    ? "text-chart-4"
                    : "text-destructive"
              )}
            >
              {soc.toFixed(1)}%
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded bg-muted">
            <div
              className={cn(
                "h-full transition-all",
                socStatus === "ok"
                  ? "bg-secondary"
                  : socStatus === "warning"
                    ? "bg-chart-4"
                    : "bg-destructive"
              )}
              style={{ width: `${soc}%` }}
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            {socStatus === "ok" ? (
              <CheckCircle className="h-3 w-3 text-secondary" />
            ) : (
              <AlertTriangle
                className={cn(
                  "h-3 w-3",
                  socStatus === "warning"
                    ? "text-chart-4"
                    : "text-destructive"
                )}
              />
            )}

            <span
              className={cn(
                "text-[10px] uppercase",
                socStatus === "ok"
                  ? "text-secondary"
                  : socStatus === "warning"
                    ? "text-chart-4"
                    : "text-destructive"
              )}
            >
              {socStatus === "ok"
                ? "Battery Healthy"
                : socStatus === "warning"
                  ? "Low Battery"
                  : "Critical Battery"}
            </span>
          </div>
        </div>

        {/* SOH */}
        <div className="border border-border bg-background/50 p-3">

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase text-muted-foreground">
              State Of Health
            </span>

            <span className="text-xs font-bold text-accent">
              {soh.toFixed(1)}%
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${soh}%` }}
            />
          </div>
        </div>

        {/* Voltage */}
        <div className="flex items-center justify-between border border-border bg-background/50 p-3">
          <span className="text-xs uppercase text-muted-foreground">
            Battery Voltage
          </span>

          <span className="font-mono text-sm font-bold text-foreground">
            {voltage.toFixed(1)} V
          </span>
        </div>
      </div>
    </div>
  )
}