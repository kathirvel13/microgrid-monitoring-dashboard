"use client"

import { useState } from "react"
import { Shield, Bell, Database, Wifi, Cloud } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEnergyStore } from "@/lib/energy-store"

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("mqtt")
  const { connection, dataLog } = useEnergyStore()

  const sections = [
    { id: "mqtt", label: "MQTT Connection", icon: Wifi },
    { id: "thingspeak", label: "ThingSpeak", icon: Cloud },
    { id: "alerts", label: "Alert Thresholds", icon: Bell },
    { id: "database", label: "Data Storage", icon: Database },
    { id: "security", label: "Security", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="pt-16 lg:ml-64">
        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
          {/* Settings Nav */}
          <div className="w-full shrink-0 overflow-x-auto border-b border-border bg-card md:w-56 md:overflow-x-visible md:border-b-0 md:border-r">
            <div className="flex gap-1 p-2 md:block md:p-4">
              <h2 className="mb-2 hidden text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4 md:block">
                Settings
              </h2>
              <nav className="flex gap-1 md:block md:space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-xs transition-all md:w-full md:text-sm",
                      activeSection === section.id
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {activeSection === "mqtt" && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wider text-foreground md:text-xl">
                    MQTT Connection
                  </h1>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    Real-time data connection to your hardware via MQTT
                  </p>
                </div>

                {/* Connection Status */}
                <div className={cn(
                  "border p-4",
                  connection.mqtt ? "border-secondary/50 bg-secondary/10" : "border-destructive/50 bg-destructive/10"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      connection.mqtt ? "animate-pulse bg-secondary" : "bg-destructive"
                    )} />
                    <span className={cn(
                      "font-medium",
                      connection.mqtt ? "text-secondary" : "text-destructive"
                    )}>
                      {connection.mqtt ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  {connection.lastMqttMessage && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last message: {new Date(connection.lastMqttMessage).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Broker Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">MQTT Broker URL</label>
                      <Input value="wss://broker.emqx.io:8084/mqtt" readOnly className="font-mono" />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Public EMQX broker (same as your Python script)
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Battery Topic</label>
                        <Input value="battery/data" readOnly className="font-mono" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Power Topic</label>
                        <Input value="power/data" readOnly className="font-mono" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Expected Data Format
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">battery/data payload:</p>
                      <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">
{`{
  "voltage": 25.5,
  "current": 10.2,
  "power": 260.1,
  "soc": 75,
  "soh": 95.5,
  "health": "Good",
  "timestamp": "2024-01-15T10:30:00Z"
}`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">power/data payload:</p>
                      <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-[10px] text-muted-foreground">
{`{
  "ac1_voltage": 220.5,
  "ac1_current": 2.5,
  "ac1_power": 550.0,
  "ac1_frequency": 50.1,
  "ac1_pf": 0.98,
  "ac2_voltage": 221.0,
  "ac2_current": 1.8,
  "ac2_power": 398.0,
  "ac2_frequency": 50.0,
  "ac2_pf": 0.97,
  "priority": "HIGH_PRIORITY",
  "source": "BATTERY",
  "timestamp2": "2024-01-15T10:30:00Z"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Message Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Messages</p>
                      <p className="font-mono text-2xl font-bold text-foreground">{dataLog.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Battery Messages</p>
                      <p className="font-mono text-2xl font-bold text-secondary">
                        {dataLog.filter(d => d.topic === "battery/data").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Power Messages</p>
                      <p className="font-mono text-2xl font-bold text-chart-4">
                        {dataLog.filter(d => d.topic === "power/data").length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "thingspeak" && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wider text-foreground md:text-xl">
                    ThingSpeak Configuration
                  </h1>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    Historical data storage via ThingSpeak IoT platform
                  </p>
                </div>

                <div className="border border-chart-4/50 bg-chart-4/10 p-4">
                  <h4 className="font-medium text-chart-4">Configuration Instructions</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set the following environment variables in Vercel (Settings &rarr; Vars):
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    <li><code className="text-foreground">NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID</code> - Your ThingSpeak Channel ID</li>
                    <li><code className="text-foreground">NEXT_PUBLIC_THINGSPEAK_READ_API_KEY</code> - Your Read API Key</li>
                  </ul>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Your Python Script Configuration
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Write API Key (from your script)</label>
                      <Input value="2U42ZCXWAVVFZL9R" readOnly className="font-mono" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">ThingSpeak API Endpoint</label>
                      <Input value="https://api.thingspeak.com/update" readOnly className="font-mono" />
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Field Mapping
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-2 text-left font-medium text-muted-foreground">Field</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Data</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr><td className="py-2 font-mono">field1</td><td>DC Voltage</td><td>V</td></tr>
                        <tr><td className="py-2 font-mono">field2</td><td>DC Current</td><td>A</td></tr>
                        <tr><td className="py-2 font-mono">field3</td><td>DC Power</td><td>W</td></tr>
                        <tr><td className="py-2 font-mono">field4</td><td>AC1 Voltage</td><td>V</td></tr>
                        <tr><td className="py-2 font-mono">field5</td><td>AC1 Current</td><td>A</td></tr>
                        <tr><td className="py-2 font-mono">field6</td><td>AC1 Power</td><td>W</td></tr>
                        <tr><td className="py-2 font-mono">field7</td><td>Battery SOC</td><td>%</td></tr>
                        <tr><td className="py-2 font-mono">field8</td><td>Priority</td><td>-</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "alerts" && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wider text-foreground md:text-xl">
                    Alert Thresholds
                  </h1>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    Configure alert triggers based on your hardware readings
                  </p>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Battery Alerts
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Low SoC Warning (%)</label>
                      <Input type="number" defaultValue={40} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Low SoC Critical (%)</label>
                      <Input type="number" defaultValue={20} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Low Voltage Warning (V)</label>
                      <Input type="number" defaultValue={22} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Low Voltage Critical (V)</label>
                      <Input type="number" defaultValue={20} />
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Power Alerts
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">High Current Warning (A)</label>
                      <Input type="number" defaultValue={50} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">High Power Warning (W)</label>
                      <Input type="number" defaultValue={3000} />
                    </div>
                  </div>
                </div>

                <Button>Save Alert Settings</Button>
              </div>
            )}

            {activeSection === "database" && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wider text-foreground md:text-xl">
                    Data Storage
                  </h1>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    Your Python script stores data in MySQL. This dashboard reads from ThingSpeak.
                  </p>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    MySQL Configuration (from your script)
                  </h3>
                  <div className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Host</label>
                        <Input value="localhost" readOnly className="font-mono" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Database</label>
                        <Input value="energy_monitor" readOnly className="font-mono" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">User</label>
                        <Input value="admin" readOnly className="font-mono" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Table</label>
                        <Input value="sensor_data" readOnly className="font-mono" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Data Flow Architecture
                  </h3>
                  <div className="rounded bg-muted p-4 font-mono text-xs">
                    <p className="text-secondary">Hardware (PZEM + DC Meter)</p>
                    <p className="ml-4 text-muted-foreground">&darr; Modbus RS485</p>
                    <p className="text-chart-4">Raspberry Pi (Python Script)</p>
                    <p className="ml-4 text-muted-foreground">&darr; MQTT Publish</p>
                    <p className="text-accent">EMQX Broker (broker.emqx.io)</p>
                    <p className="ml-4 text-muted-foreground">&darr; WebSocket Subscribe</p>
                    <p className="text-primary">This Dashboard (Real-time)</p>
                    <p className="mt-2 text-chart-4">Raspberry Pi (Python Script)</p>
                    <p className="ml-4 text-muted-foreground">&darr; HTTP POST</p>
                    <p className="text-secondary">ThingSpeak (Historical Storage)</p>
                    <p className="ml-4 text-muted-foreground">&darr; HTTP GET</p>
                    <p className="text-primary">This Dashboard (Charts)</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-wider text-foreground md:text-xl">
                    Security Settings
                  </h1>
                  <p className="text-xs text-muted-foreground md:text-sm">API keys and access control</p>
                </div>

                <div className="border border-chart-4/50 bg-chart-4/10 p-4">
                  <h4 className="font-medium text-chart-4">Security Note</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your MQTT broker (broker.emqx.io) is a public broker. For production use, consider:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    <li>Using a private MQTT broker with authentication</li>
                    <li>Enabling TLS/SSL encryption</li>
                    <li>Using unique topic names to prevent data collisions</li>
                  </ul>
                </div>

                <div className="border border-border bg-card p-3 md:p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground md:mb-4">
                    Environment Variables
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Store sensitive API keys as environment variables in Vercel, not in code.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
