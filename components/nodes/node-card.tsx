"use client"

import { cn } from "@/lib/utils"
import { Battery, Zap, Sun, Wifi, WifiOff, Clock } from "lucide-react"
import type { NodeMetadata, Telemetry, PowerTelemetry, BatteryTelemetry, PVTelemetry } from "@/lib/types"

interface NodeCardProps {
  node: NodeMetadata
  telemetry?: Telemetry
  onClick?: () => void
  isSelected?: boolean
}

export function NodeCard({ node, telemetry, onClick, isSelected }: NodeCardProps) {
  const typeIcons = {
    power: Zap,
    battery: Battery,
    pv: Sun,
  }

  const statusColors = {
    ok: "border-secondary/50",
    warning: "border-chart-4/50",
    offline: "border-destructive/50",
  }

  const Icon = typeIcons[node.type]

  const formatTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime()
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const renderMetrics = () => {
    if (!telemetry) return null

    switch (telemetry.type) {
      case "power": {
        const t = telemetry as PowerTelemetry
        return (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Voltage</p>
              <p className="font-mono text-sm text-foreground">{t.voltage_v.toFixed(1)}V</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Current</p>
              <p className="font-mono text-sm text-foreground">{t.current_a.toFixed(1)}A</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Power</p>
              <p className="font-mono text-sm text-secondary">{(t.active_power_w / 1000).toFixed(2)}kW</p>
            </div>
          </div>
        )
      }
      case "battery": {
        const t = telemetry as BatteryTelemetry
        return (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">SoC</p>
              <p className="font-mono text-sm text-secondary">{t.soc_pct}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Current</p>
              <p className={cn("font-mono text-sm", t.current_a < 0 ? "text-secondary" : "text-chart-4")}>
                {t.current_a.toFixed(1)}A
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Temp</p>
              <p className="font-mono text-sm text-foreground">{t.temperature_c.toFixed(1)}°C</p>
            </div>
          </div>
        )
      }
      case "pv": {
        const t = telemetry as PVTelemetry
        return (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Power</p>
              <p className="font-mono text-sm text-secondary">{(t.pv_power_w / 1000).toFixed(2)}kW</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Irrad.</p>
              <p className="font-mono text-sm text-foreground">{t.irradiance_w_m2}W/m²</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Soiling</p>
              <p
                className={cn(
                  "font-mono text-sm",
                  t.soiling_index > 0.9
                    ? "text-secondary"
                    : t.soiling_index > 0.7
                      ? "text-chart-4"
                      : "text-destructive",
                )}
              >
                {(t.soiling_index * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )
      }
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full border bg-card p-4 text-left transition-all hover:bg-card/80",
        statusColors[node.status],
        isSelected && "ring-2 ring-primary",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center",
              node.status === "ok"
                ? "bg-secondary/20"
                : node.status === "warning"
                  ? "bg-chart-4/20"
                  : "bg-destructive/20",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                node.status === "ok"
                  ? "text-secondary"
                  : node.status === "warning"
                    ? "text-chart-4"
                    : "text-destructive",
              )}
            />
          </div>
          <div>
            <p className="font-mono text-sm font-bold text-foreground">{node.nodeId}</p>
            <p className="text-[10px] uppercase text-muted-foreground">{node.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {node.status === "offline" ? (
            <WifiOff className="h-4 w-4 text-destructive" />
          ) : (
            <Wifi className="h-4 w-4 text-secondary" />
          )}
          <span className="text-[10px] font-mono text-muted-foreground">{telemetry?.rssi || "--"}dB</span>
        </div>
      </div>

      {/* Location */}
      <p className="mt-2 text-xs text-muted-foreground">{node.location}</p>

      {/* Metrics */}
      <div className="mt-3">{renderMetrics()}</div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTime(node.lastSeen)}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{node.firmwareVersion}</span>
      </div>
    </button>
  )
}
