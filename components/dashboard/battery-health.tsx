"use client"

import { Battery, Activity, Heart, Zap, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

// Battery specifications: 6Ah, 11.1V (3S Li-ion)
const BATTERY_CAPACITY_AH = 6
const BATTERY_NOMINAL_VOLTAGE = 11.1
const BATTERY_FULL_VOLTAGE = 12.6
const BATTERY_EMPTY_VOLTAGE = 9.0

interface BatteryHealthProps {
  soc: number | null
  soh?: number | null
  voltage?: number | null
  current?: number | null
  health?: string | null
  isOffline?: boolean
}

export function BatteryHealth({ 
  soc, 
  soh = null, 
  voltage = null, 
  current = null,
  health = null,
  isOffline = false,
}: BatteryHealthProps) {
  const hasData = soc !== null
  const socValue = soc ?? 0
  const sohValue = soh ?? 100
  const voltageValue = voltage ?? 0
  const currentValue = current ?? 0
  
  const socStatus = !hasData ? "offline" : socValue < 20 ? "critical" : socValue < 40 ? "warning" : "ok"
  const isCharging = currentValue < 0
  const isDischarging = currentValue > 0
  
  // Calculate capacity in Wh
  const capacityWh = BATTERY_CAPACITY_AH * BATTERY_NOMINAL_VOLTAGE
  const remainingWh = hasData ? (socValue / 100) * capacityWh : 0

  return (
    <div className={cn(
      "border bg-card p-4",
      isOffline ? "border-muted/50" : "border-border"
    )}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Battery Health</h3>
        {isOffline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </div>
        )}
      </div>

      {/* SoC Gauge */}
      <div className="mb-4 flex items-center gap-4">
        <div className={cn(
          "relative h-24 w-16 border-2",
          isOffline ? "border-muted" : "border-current"
        )}>
          <div className={cn(
            "absolute left-0 right-0 top-[-6px] mx-auto h-2 w-6",
            isOffline ? "bg-muted" : "bg-current"
          )} />
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 transition-all duration-500",
              isOffline ? "bg-muted" : socStatus === "ok" ? "bg-secondary" : socStatus === "warning" ? "bg-chart-4" : "bg-destructive",
            )}
            style={{ height: hasData ? `${Math.min(100, Math.max(0, socValue))}%` : "0%" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-mono text-lg font-bold drop-shadow-lg",
              isOffline ? "text-muted-foreground" : "text-foreground"
            )}>
              {hasData ? `${socValue.toFixed(0)}%` : "-"}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Battery className={cn("h-4 w-4", isOffline ? "text-muted-foreground" : "text-secondary")} />
            <span className="text-muted-foreground">State of Charge</span>
            <span
              className={cn(
                "ml-auto font-mono font-bold",
                isOffline ? "text-muted-foreground" : socStatus === "ok" ? "text-secondary" : socStatus === "warning" ? "text-chart-4" : "text-destructive",
              )}
            >
              {isOffline ? "OFFLINE" : socStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Heart className={cn("h-4 w-4", isOffline ? "text-muted-foreground" : "text-accent")} />
            <span className="text-muted-foreground">State of Health</span>
            <span className={cn("ml-auto font-mono", isOffline && "text-muted-foreground")}>
              {soh !== null ? `${sohValue.toFixed(1)}%` : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Activity className={cn("h-4 w-4", isOffline ? "text-muted-foreground" : "text-chart-4")} />
            <span className="text-muted-foreground">Health Status</span>
            <span className={cn(
              "ml-auto font-mono",
              isOffline ? "text-muted-foreground" : health === "Good" ? "text-secondary" : health === "Moderate" ? "text-chart-4" : "text-destructive"
            )}>
              {health ?? "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">DC Voltage</span>
          <span className={cn("font-mono", isOffline && "text-muted-foreground")}>
            {voltage !== null ? `${voltageValue.toFixed(2)} V` : "-"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">DC Current</span>
          <span className={cn(
            "font-mono",
            isOffline ? "text-muted-foreground" : isCharging ? "text-secondary" : isDischarging ? "text-chart-4" : "text-foreground"
          )}>
            {current !== null ? (
              <>
                {currentValue.toFixed(2)} A
                {isCharging && " (Charging)"}
                {isDischarging && " (Discharging)"}
              </>
            ) : "-"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">DC Power</span>
          <span className={cn("font-mono", isOffline && "text-muted-foreground")}>
            {voltage !== null && current !== null ? `${(voltageValue * Math.abs(currentValue)).toFixed(1)} W` : "-"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Remaining Energy</span>
          <span className={cn("font-mono", isOffline && "text-muted-foreground")}>
            {hasData ? `${remainingWh.toFixed(1)} Wh` : "-"}
          </span>
        </div>
      </div>

      {/* Battery Specs */}
      <div className="mt-3 space-y-2 border-t border-border pt-3">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>3S Li-ion | {BATTERY_CAPACITY_AH}Ah | {BATTERY_NOMINAL_VOLTAGE}V | {capacityWh.toFixed(1)}Wh</span>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Voltage Range</span>
          <span className="font-mono">{BATTERY_EMPTY_VOLTAGE}V - {BATTERY_FULL_VOLTAGE}V</span>
        </div>
      </div>

      {/* SOH Bar */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Battery Health (SOH)</span>
          <span className="font-mono">{soh !== null ? `${sohValue.toFixed(1)}%` : "-"}</span>
        </div>
        <div className="h-2 bg-muted">
          <div 
            className={cn(
              "h-full transition-all",
              isOffline ? "bg-muted-foreground" : sohValue > 80 ? "bg-secondary" : sohValue > 50 ? "bg-chart-4" : "bg-destructive"
            )}
            style={{ width: soh !== null ? `${sohValue}%` : "0%" }} 
          />
        </div>
      </div>
    </div>
  )
}
