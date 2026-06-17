"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface KPITileProps {
  title: string
  value: string
  unit: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  status?: "ok" | "warning" | "critical" | "offline"
  onClick?: () => void
}

export function KPITile({
  title,
  value,
  unit,
  icon: Icon,
  trend = "neutral",
  trendValue,
  status = "ok",
  onClick,
}: KPITileProps) {
  const statusColors = {
    ok: "border-secondary/50 bg-secondary/5",
    warning: "border-chart-4/50 bg-chart-4/5",
    critical: "border-destructive/50 bg-destructive/5",
    offline: "border-muted/50 bg-muted/5",
  }

  const trendColors = {
    up: "text-secondary",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const isOffline = status === "offline" || value === "-"

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 border p-4 text-left transition-all hover:bg-card/80",
        statusColors[status],
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{title}</span>
        <Icon
          className={cn(
            "h-4 w-4",
            isOffline ? "text-muted-foreground" : status === "ok" ? "text-secondary" : status === "warning" ? "text-chart-4" : "text-destructive",
          )}
        />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-mono text-3xl font-bold", isOffline ? "text-muted-foreground" : "text-foreground")}>{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {isOffline ? (
        <div className="text-xs text-muted-foreground">Offline</div>
      ) : trendValue ? (
        <div className={cn("flex items-center gap-1 text-xs", trendColors[trend])}>
          <TrendIcon className="h-3 w-3" />
          <span>{trendValue}</span>
        </div>
      ) : null}
    </button>
  )
}
