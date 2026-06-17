"use client"

import { useState } from "react"
import { Download, FileText, Wrench, DollarSign, Sun } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock predictive maintenance data
const maintenanceItems = [
  { asset: "Battery Bank A", risk: 75, failureWindow: "15-30 days", action: "Replace cells 3-4", confidence: 0.82 },
  { asset: "PV String 2", risk: 62, failureWindow: "30-60 days", action: "Clean panels", confidence: 0.91 },
  { asset: "Inverter 1", risk: 45, failureWindow: "60-90 days", action: "Inspect capacitors", confidence: 0.76 },
  { asset: "Power Meter 3", risk: 28, failureWindow: "90+ days", action: "Calibration due", confidence: 0.88 },
]

const soilingData = [
  { string: "PV Array 1", index: 0.92, trend: "stable", recommendation: "No action needed", yield: "+0%" },
  { string: "PV Array 2", index: 0.78, trend: "declining", recommendation: "Clean within 7 days", yield: "+9%" },
  { string: "PV Array 3", index: 0.85, trend: "stable", recommendation: "Schedule cleaning", yield: "+5%" },
]

const recommendations = [
  { priority: 1, action: "Clean PV String 2", impact: "+9% output", cost: "₹50", payback: "3 days" },
  { priority: 2, action: "Replace battery cells 3-4", impact: "Prevent failure", cost: "₹800", payback: "2 months" },
  { priority: 3, action: "Optimize charge schedule", impact: "+5% efficiency", cost: "₹0", payback: "Immediate" },
  {
    priority: 4,
    action: "Install temperature monitoring",
    impact: "Predictive alerts",
    cost: "₹200",
    payback: "6 months",
  },
]

export default function ReportsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"maintenance" | "savings" | "soiling" | "recommendations">("maintenance")

  const monthlySavings = 1240
  const yearToDateSavings = 14880
  const selfConsumptionRate = 78

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="pt-16 lg:ml-64">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-foreground md:text-2xl">
                Reports & Analytics
              </h1>
              <p className="text-xs text-muted-foreground md:text-sm">
                Predictive maintenance, savings, and recommendations
              </p>
            </div>
            <Button size="sm" className="w-full md:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border pb-px md:mb-6">
            {[
              { id: "maintenance", label: "Predictive Maintenance", icon: Wrench, shortLabel: "Maintenance" },
              { id: "savings", label: "Money Saved", icon: DollarSign, shortLabel: "Savings" },
              { id: "soiling", label: "Soiling Analysis", icon: Sun, shortLabel: "Soiling" },
              { id: "recommendations", label: "Recommendations", icon: FileText, shortLabel: "Actions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium uppercase tracking-wide transition-all md:px-4 md:py-3 md:text-sm",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="md:hidden">{tab.shortLabel}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="border border-border bg-card">
                <div className="border-b border-border px-3 py-2 md:px-4 md:py-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Asset Risk Assessment
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {maintenanceItems.map((item, i) => (
                    <div key={i} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:gap-4 md:p-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.asset}</p>
                        <p className="text-xs text-muted-foreground">Failure window: {item.failureWindow}</p>
                      </div>
                      <div className="flex items-center justify-between md:block md:text-center">
                        <div
                          className={cn(
                            "inline-flex h-12 w-12 items-center justify-center font-mono text-lg font-bold",
                            item.risk > 60
                              ? "bg-destructive/20 text-destructive"
                              : item.risk > 40
                                ? "bg-chart-4/20 text-chart-4"
                                : "bg-secondary/20 text-secondary",
                          )}
                        >
                          {item.risk}
                        </div>
                        <p className="mt-0 text-[10px] text-muted-foreground md:mt-1">Risk Score</p>
                      </div>
                      <div className="flex items-center justify-between md:w-48 md:flex-col md:text-right">
                        <p className="text-sm text-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {(item.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "savings" && (
            <div className="space-y-4 md:space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border border-secondary/50 bg-secondary/10 p-6">
                  <p className="text-xs uppercase text-muted-foreground">Monthly Savings</p>
                  <p className="mt-2 font-mono text-4xl font-bold text-secondary">₹{monthlySavings.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">vs grid-only baseline</p>
                </div>
                <div className="border border-accent/50 bg-accent/10 p-6">
                  <p className="text-xs uppercase text-muted-foreground">Year-to-Date</p>
                  <p className="mt-2 font-mono text-4xl font-bold text-accent">₹{yearToDateSavings.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">cumulative savings</p>
                </div>
                <div className="border border-chart-4/50 bg-chart-4/10 p-6">
                  <p className="text-xs uppercase text-muted-foreground">Self-Consumption</p>
                  <p className="mt-2 font-mono text-4xl font-bold text-chart-4">{selfConsumptionRate}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">of PV generation used</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border border-border bg-card p-4">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Savings Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "PV Self-Consumption", value: 890, pct: 72 },
                    { label: "Battery Arbitrage", value: 210, pct: 17 },
                    { label: "Peak Shaving", value: 140, pct: 11 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-mono text-foreground">₹{item.value}</span>
                      </div>
                      <div className="h-2 bg-muted">
                        <div className="h-full bg-secondary" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "soiling" && (
            <div className="space-y-4">
              <div className="border border-border bg-card">
                <div className="border-b border-border px-3 py-2 md:px-4 md:py-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Panel Soiling Analysis
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {soilingData.map((item, i) => (
                    <div key={i} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:gap-4 md:p-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.string}</p>
                        <p className="text-xs text-muted-foreground">Trend: {item.trend}</p>
                      </div>
                      <div className="flex items-center justify-between md:block md:text-center">
                        <div
                          className={cn(
                            "inline-flex h-12 w-16 items-center justify-center font-mono text-lg font-bold",
                            item.index > 0.9
                              ? "bg-secondary/20 text-secondary"
                              : item.index > 0.7
                                ? "bg-chart-4/20 text-chart-4"
                                : "bg-destructive/20 text-destructive",
                          )}
                        >
                          {(item.index * 100).toFixed(0)}%
                        </div>
                        <p className="mt-0 text-[10px] text-muted-foreground md:mt-1">Cleanliness</p>
                      </div>
                      <div className="md:w-48">
                        <p className="text-sm text-foreground">{item.recommendation}</p>
                        <p className="text-xs text-secondary">Expected yield recovery: {item.yield}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "recommendations" && (
            <div className="space-y-4">
              <div className="border border-border bg-card">
                <div className="border-b border-border px-3 py-2 md:px-4 md:py-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Actionable Recommendations
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {recommendations.map((item, i) => (
                    <div key={i} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:gap-4 md:p-4">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center font-mono font-bold",
                          item.priority === 1
                            ? "bg-destructive/20 text-destructive"
                            : item.priority === 2
                              ? "bg-chart-4/20 text-chart-4"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.priority}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.action}</p>
                        <p className="text-xs text-secondary">{item.impact}</p>
                      </div>
                      <div className="flex items-center justify-between md:block md:text-right md:text-sm">
                        <p className="text-foreground">{item.cost}</p>
                        <p className="text-xs text-muted-foreground">Payback: {item.payback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
