"use client"

import { useEffect, useState } from "react"

import { mqttClient } from "@/lib/mqtt"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function RealtimePage() {

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false)

  const [batteryData, setBatteryData] =
    useState<any>(null)

  useEffect(() => {

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

          } catch (err) {

            console.log(
              "JSON Parse Error:",
              err
            )
          }
        }
      }
    )

    return () => {

      mqttClient.removeAllListeners(
        "message"
      )
    }

  }, [])

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
          <div className="mb-6">

            <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground">
              Battery Realtime Monitoring
            </h1>

            <p className="text-sm text-muted-foreground">
              Live battery telemetry from MQTT
            </p>

          </div>

          {/* Cards Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* DC Battery Data Card */}
            <div className="border border-border bg-card p-6 rounded-xl">

              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Live DC Battery Data
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <MetricRow
                  label="DC Voltage"
                  value={`${batteryData?.dc_voltage?.toFixed(2) || 0} V`}
                />

                <MetricRow
                  label="DC Current"
                  value={`${batteryData?.dc_current?.toFixed(2) || 0} A`}
                />

                <MetricRow
                  label="DC Power"
                  value={`${batteryData?.dc_power?.toFixed(2) || 0} W`}
                />

                <MetricRow
                  label="SOC"
                  value={`${batteryData?.soc?.toFixed(1) || 0}%`}
                />

                <MetricRow
                  label="SOH"
                  value={`${batteryData?.soh?.toFixed(1) || 0}%`}
                />

                <MetricRow
                  label="Timestamp"
                  value={
                    batteryData?.timestamp
                      ? new Date(
                          batteryData.timestamp * 1000
                        ).toLocaleTimeString()
                      : "-"
                  }
                />

              </div>
            </div>

            {/* Live Solar Data Card */}
            <div className="border border-border bg-card p-6 rounded-xl">

              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Live Solar Data
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <MetricRow
                  label="Solar Voltage"
                  value="0.00 V"
                />

                <MetricRow
                  label="Solar Current"
                  value="0.00 A"
                />

                <MetricRow
                  label="Solar Power"
                  value="0.00 W"
                />

                <MetricRow
                  label="Solar Frequency"
                  value="0.00 Hz"
                />

                <MetricRow
                  label="Solar Power Factor"
                  value="0.00"
                />

                <MetricRow
                  label="Solar Status"
                  value="OFF"
                />

              </div>
            </div>

            {/* AC1 Monitoring Card */}
            <div className="border border-border bg-card p-6 rounded-xl">

              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                AC1 Monitoring
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <MetricRow
                  label="AC1 Voltage"
                  value={`${batteryData?.ac1_voltage?.toFixed(2) || 0} V`}
                />

                <MetricRow
                  label="AC1 Current"
                  value={`${batteryData?.ac1_current?.toFixed(2) || 0} A`}
                />

                <MetricRow
                  label="AC1 Power"
                  value={`${batteryData?.ac1_power?.toFixed(2) || 0} W`}
                />

                <MetricRow
                  label="AC1 Frequency"
                  value={`${batteryData?.ac1_frequency?.toFixed(2) || 0} Hz`}
                />

                <MetricRow
                  label="AC1 Power Factor"
                  value={`${batteryData?.ac1_power_factor?.toFixed(2) || 0}`}
                />

              </div>
            </div>

            {/* AC2 Monitoring Card */}
            <div className="border border-border bg-card p-6 rounded-xl">

              <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                AC2 Monitoring
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <MetricRow
                  label="AC2 Voltage"
                  value={`${batteryData?.ac2_voltage?.toFixed(2) || 0} V`}
                />

                <MetricRow
                  label="AC2 Current"
                  value={`${batteryData?.ac2_current?.toFixed(2) || 0} A`}
                />

                <MetricRow
                  label="AC2 Power"
                  value={`${batteryData?.ac2_power?.toFixed(2) || 0} W`}
                />

                <MetricRow
                  label="AC2 Frequency"
                  value={`${batteryData?.ac2_frequency?.toFixed(2) || 0} Hz`}
                />

                <MetricRow
                  label="AC2 Power Factor"
                  value={`${batteryData?.ac2_power_factor?.toFixed(2) || 0}`}
                />

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

function MetricRow({
  label,
  value,
}: {
  label: string
  value: string
}) {

  return (

    <div className="flex items-center justify-between border border-border bg-background p-4 rounded-lg">

      <span className="text-xs uppercase text-muted-foreground">
        {label}
      </span>

      <span className="font-mono text-lg font-bold text-foreground">
        {value}
      </span>

    </div>
  )
}