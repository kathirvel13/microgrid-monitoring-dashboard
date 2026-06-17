"use client"

import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

import type { LucideIcon } from "lucide-react"

interface KPITileProps {
  title: string
  value: string
  unit: string
  icon: LucideIcon

  trend?: "up" | "down" | "neutral"

  trendValue?: string

  status?: "ok" | "warning" | "critical"

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

    warning:
      "border-chart-4/50 bg-chart-4/5",

    critical:
      "border-destructive/50 bg-destructive/5",
  }

  const trendColors = {
    up: "text-secondary",

    down: "text-destructive",

    neutral: "text-muted-foreground",
  }

  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
        ? TrendingDown
        : Minus

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 border p-4 text-left transition-all hover:bg-card/80 rounded-lg",

        statusColors[status],

        onClick && "cursor-pointer"
      )}
    >

      {/* TOP */}
      <div className="flex items-center justify-between">

        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">

          {title}

        </span>

        <Icon
          className={cn(
            "h-5 w-5",

            status === "ok"
              ? "text-secondary"
              : status === "warning"
                ? "text-chart-4"
                : "text-destructive"
          )}
        />
      </div>

      {/* VALUE */}
      <div className="flex items-end gap-2">

        <span className="font-mono text-3xl font-bold text-foreground">

          {value}

        </span>

        <span className="pb-1 text-sm text-muted-foreground">

          {unit}

        </span>
      </div>

      {/* TREND */}
      {trendValue && (

        <div
          className={cn(
            "flex items-center gap-1 text-xs",

            trendColors[trend]
          )}
        >

          <TrendIcon className="h-3 w-3" />

          <span>{trendValue}</span>

        </div>
      )}

      {/* STATUS */}
      <div className="mt-1 flex items-center justify-between border-t border-border pt-2">

        <span className="text-[10px] uppercase text-muted-foreground">

          Status

        </span>

        <span
          className={cn(
            "text-[10px] font-bold uppercase",

            status === "ok"
              ? "text-secondary"

              : status === "warning"
                ? "text-chart-4"

                : "text-destructive"
          )}
        >

          {status}

        </span>
      </div>
    </button>
  )
}