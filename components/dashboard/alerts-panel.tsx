"use client"

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEnergyStore } from "@/lib/energy-store"

export function AlertsPanel() {
  const { alerts, acknowledgeAlert } = useEnergyStore()
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
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

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Alerts</h3>
        <span className="font-mono text-xs text-foreground">{alerts.filter((a) => !a.acknowledged).length} unack</span>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto p-2">
        {sortedAlerts.map((alert) => {
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase">{alert.type.replace("_", " ")}</span>
                    <span className="text-[10px] font-mono opacity-70">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs opacity-90">{alert.message}</p>
                  <p className="mt-1 text-[10px] opacity-70">{alert.nodeId}</p>
                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-6 text-[10px] uppercase bg-transparent"
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
        })}
      </div>
    </div>
  )
}
