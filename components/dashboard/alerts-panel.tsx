"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEnergyStore } from "@/lib/energy-store"
import type { AlertSeverity } from "@/lib/types"

export function AlertsPanel() {
  const { alerts, acknowledgeAlert, clearAlerts } = useEnergyStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const severityIcon = {
    critical: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const severityColors = {
    critical: "border-destructive/50 bg-destructive/10 text-destructive",
    warning: "border-chart-4/50 bg-chart-4/10 text-chart-4",
    info: "border-accent/50 bg-accent/10 text-accent",
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Alerts</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-foreground">{unacknowledgedCount} unack</span>
          {alerts.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px]"
              onClick={clearAlerts}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto p-2">
        {sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-2 h-8 w-8 text-secondary" />
            <p className="text-sm text-muted-foreground">No alerts</p>
            <p className="text-xs text-muted-foreground">System operating normally</p>
          </div>
        ) : (
          sortedAlerts.map((alert) => {
            const Icon = severityIcon[alert.severity]
            return (
              <div
                key={alert.id}
                className={cn(
                  "border p-3 transition-all",
                  severityColors[alert.severity],
                  alert.acknowledged && "opacity-50",
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase">{alert.type.replace(/_/g, " ")}</span>
                      <span className="font-mono text-[10px] opacity-70">
                        {mounted ? new Date(alert.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }) : "--:--"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs opacity-90">{alert.message}</p>
                    {alert.value !== undefined && (
                      <p className="mt-1 font-mono text-[10px] opacity-70">Value: {alert.value}</p>
                    )}
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-6 bg-transparent text-[10px] uppercase"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
