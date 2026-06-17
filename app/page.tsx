"use client"

import { useEffect, useState } from "react"
import {
  Battery,
  Gauge,
  Activity,
  AlertTriangle,
} from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { KPITile } from "@/components/dashboard/kpi-tile"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { BatteryHealth } from "@/components/dashboard/battery-health"
import { OptimizerLog } from "@/components/dashboard/optimizer-log"
import { TimeSeriesChart } from "@/components/charts/time-series-chart"

import { useEnergyStore } from "@/lib/energy-store"
import { mqttClient } from "@/lib/mqtt"

export default function DashboardPage() {

  const {
    alerts,
    refreshData,
  } = useEnergyStore()

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false)

  const [batteryData, setBatteryData] =
    useState<any>(null)

  const [historyData, setHistoryData] =
    useState<any[]>([])

  const activeAlerts =
    alerts.filter((a) => !a.acknowledged).length

  useEffect(() => {

    refreshData()

    const interval = setInterval(
      refreshData,
      5000
    )

    mqttClient.on(
      "message",
      (topic, message) => {

        if (topic === "battery/data") {

          try {

            const data = JSON.parse(
              message.toString()
            )

            console.log(
              "Battery MQTT:",
              data
            )

            setBatteryData(data)

            setHistoryData((prev) => {

              const updated = [
                ...prev,
                {
                  time: new Date().toLocaleTimeString(),
                  voltage: data.dc_voltage || 0,
                  soc: data.soc || 0,
                  soh: data.soh || 0,
                  timestamp: Date.now(),
                },
              ]

              // keep only last 10 mins
              return updated.filter(
                (item) =>
                  Date.now() - item.timestamp <=
                  10 * 60 * 1000
              )
            })

          } catch (err) {

            console.log(
              "MQTT Parse Error:",
              err
            )
          }
        }
      }
    )

    return () => {
      clearInterval(interval)
      mqttClient.removeAllListeners(
        "message"
      )
    }

  }, [refreshData])

  // DC Data
  const voltage =
    batteryData?.dc_voltage || 0

  const current =
    batteryData?.dc_current || 0

  const power =
    batteryData?.dc_power || 0

  const soc =
    batteryData?.soc || 0

  const soh =
    batteryData?.soh || 0

  // AC1 Data
  const ac1Voltage =
    batteryData?.ac1_voltage || 0

  const ac1Current =
    batteryData?.ac1_current || 0

  const ac1Power =
    batteryData?.ac1_power || 0

  const ac1Frequency =
    batteryData?.ac1_frequency || 0

  const ac1PowerFactor =
    batteryData?.ac1_power_factor || 0

  // AC2 Data
  const ac2Voltage =
    batteryData?.ac2_voltage || 0

  const ac2Current =
    batteryData?.ac2_current || 0

  const ac2Power =
    batteryData?.ac2_power || 0

  const ac2Frequency =
    batteryData?.ac2_frequency || 0

  const ac2PowerFactor =
    batteryData?.ac2_power_factor || 0

  return (
    <div className="min-h-screen bg-background">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <Header
        onMenuClick={() =>
          setIsSidebarOpen(true)
        }
      />

      <main className="pt-16 lg:ml-64">

        <div className="p-4 lg:p-6">

          {/* Title */}
          <div className="mb-4 lg:mb-6">

            <h1 className="text-xl lg:text-2xl font-bold uppercase tracking-wider text-foreground">
              System Overview
            </h1>

            <p className="text-xs lg:text-sm text-muted-foreground">
              Real-time battery monitoring dashboard
            </p>

          </div>

          {/* KPI Tiles */}
          <div className="mb-4 lg:mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">

            {/* Voltage */}
            <KPITile
              title="DC Voltage"
              value={voltage.toFixed(1)}
              unit="V"
              icon={Gauge}
              trend="neutral"
              trendValue="Live"
              status="ok"
            />

            {/* Current */}
            <KPITile
              title="DC Current"
              value={current.toFixed(1)}
              unit="A"
              icon={Activity}
              trend="neutral"
              trendValue="Live"
              status="ok"
            />

            {/* Power */}
            <KPITile
              title="DC Power"
              value={power.toFixed(1)}
              unit="W"
              icon={Activity}
              trend="neutral"
              trendValue="Live"
              status="ok"
            />

            {/* SOC */}
            <KPITile
              title="Battery SOC"
              value={soc.toFixed(1)}
              unit="%"
              icon={Battery}
              trend={
                soc > 50
                  ? "up"
                  : "down"
              }
              status={
                soc < 20
                  ? "critical"
                  : soc < 40
                    ? "warning"
                    : "ok"
              }
            />

            {/* SOH */}
            <KPITile
              title="Battery SOH"
              value={soh.toFixed(1)}
              unit="%"
              icon={Battery}
              trend="neutral"
              trendValue="Health"
              status="ok"
            />
          </div>

          {/* AC Monitoring Cards */}
          <div className="mb-4 lg:mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* AC1 Card */}
            <div className="rounded-xl border border-border bg-card p-5">

              <h2 className="mb-4 text-lg font-bold">
                AC1 Monitoring
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Voltage
                  </p>

                  <p className="text-2xl font-semibold">
                    {ac1Voltage.toFixed(1)} V
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Current
                  </p>

                  <p className="text-2xl font-semibold">
                    {ac1Current.toFixed(2)} A
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Power
                  </p>

                  <p className="text-xl font-medium">
                    {ac1Power.toFixed(1)} W
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Frequency
                  </p>

                  <p className="text-xl font-medium">
                    {ac1Frequency.toFixed(1)} Hz
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Power Factor
                  </p>

                  <p className="text-xl font-medium">
                    {ac1PowerFactor.toFixed(2)}
                  </p>
                </div>

              </div>
            </div>

            {/* AC2 Card */}
            <div className="rounded-xl border border-border bg-card p-5">

              <h2 className="mb-4 text-lg font-bold">
                AC2 Monitoring
              </h2>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Voltage
                  </p>

                  <p className="text-2xl font-semibold">
                    {ac2Voltage.toFixed(1)} V
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Current
                  </p>

                  <p className="text-2xl font-semibold">
                    {ac2Current.toFixed(2)} A
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Power
                  </p>

                  <p className="text-xl font-medium">
                    {ac2Power.toFixed(1)} W
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Frequency
                  </p>

                  <p className="text-xl font-medium">
                    {ac2Frequency.toFixed(1)} Hz
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Power Factor
                  </p>

                  <p className="text-xl font-medium">
                    {ac2PowerFactor.toFixed(2)}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">

            {/* Left */}
            <div className="space-y-4 lg:col-span-2 lg:space-y-6">

              {/* Graph */}
              <div className="border border-border bg-card p-4">

                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  SOC & Voltage Monitoring
                </h3>

                <TimeSeriesChart
                  historyData={historyData}
                />

              </div>
            </div>

            {/* Right */}
            <div className="space-y-4 lg:space-y-6">

              <AlertsPanel />

              <BatteryHealth
                soc={soc}
                soh={soh}
              />

              <OptimizerLog
                batteryData={batteryData}
              />

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}