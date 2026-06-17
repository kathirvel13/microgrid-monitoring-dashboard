"use client"

import { useEffect, useState } from "react"

import {
  Palette,
  Bell,
  Monitor,
  Moon,
  Sun,
  Type,
  Database,
  Shield,
  Cpu,
  Save,
  Check,
} from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { cn } from "@/lib/utils"

export default function SettingsPage() {

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false)

  const [activeSection, setActiveSection] =
    useState("general")

  const [savedMessage, setSavedMessage] =
    useState(false)

  const [settings, setSettings] = useState({

    // GENERAL
    systemName: "SMART WATTS",
    timezone: "Asia/Kolkata",
    language: "English",
    refreshInterval: 5,

    // APPEARANCE
    theme: "dark",
    fontSize: "medium",

    // NOTIFICATIONS
    batteryAlerts: true,
    voltageWarnings: true,
    mqttNotifications: true,
    emailNotifications: false,

    // SYSTEM
    mqttBroker: "broker.emqx.io",
    mqttPort: "1883",
    deviceId: "BATTERY_NODE_01",
    firmwareVersion: "v2.1.0",

    // SECURITY
    adminEmail: "admin@smartwatts.ai",

    // DATABASE
    retentionDays: 30,
    backupInterval: "24 Hours",
  })

  const sections = [
    {
      id: "general",
      label: "General",
      icon: Monitor,
    },

    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },

    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },

    {
      id: "system",
      label: "System",
      icon: Cpu,
    },

    {
      id: "security",
      label: "Security",
      icon: Shield,
    },

    {
      id: "database",
      label: "Database",
      icon: Database,
    },
  ]

  // LOAD SAVED SETTINGS
  useEffect(() => {

    const saved =
      localStorage.getItem(
        "smartwatts-settings"
      )

    if (saved) {

      const parsed =
        JSON.parse(saved)

      setSettings(parsed)

      applyTheme(parsed.theme)
      applyFontSize(parsed.fontSize)
    }

  }, [])

  // APPLY THEME
  const applyTheme = (
    theme: string
  ) => {

    if (theme === "dark") {

      document.documentElement.classList.add(
        "dark"
      )

    } else {

      document.documentElement.classList.remove(
        "dark"
      )
    }
  }

  // APPLY FONT SIZE
  const applyFontSize = (
    size: string
  ) => {

    if (size === "small") {

      document.documentElement.style.fontSize =
        "14px"

    } else if (
      size === "large"
    ) {

      document.documentElement.style.fontSize =
        "18px"

    } else {

      document.documentElement.style.fontSize =
        "16px"
    }
  }

  // SAVE SETTINGS
  const saveSettings = () => {

    localStorage.setItem(
      "smartwatts-settings",
      JSON.stringify(settings)
    )

    applyTheme(settings.theme)

    applyFontSize(
      settings.fontSize
    )

    setSavedMessage(true)

    setTimeout(() => {
      setSavedMessage(false)
    }, 3000)
  }

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

        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">

          {/* SETTINGS SIDEBAR */}
          <div className="w-full shrink-0 overflow-x-auto border-b border-border bg-card md:w-64 md:border-b-0 md:border-r">

            <div className="flex gap-1 p-2 md:block md:p-4">

              <h2 className="mb-4 hidden text-xs font-bold uppercase tracking-widest text-muted-foreground md:block">
                Settings
              </h2>

              <nav className="flex gap-1 md:block md:space-y-1">

                {sections.map((section) => (

                  <button
                    key={section.id}

                    onClick={() =>
                      setActiveSection(
                        section.id
                      )
                    }

                    className={cn(
                      "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-xs transition-all md:w-full md:text-sm",

                      activeSection ===
                        section.id
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >

                    <section.icon className="h-4 w-4" />

                    <span className="hidden sm:inline">
                      {section.label}
                    </span>

                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">

            {/* GENERAL */}
            {activeSection ===
              "general" && (

              <div className="space-y-6">

                <div>

                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    General Settings
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Configure dashboard
                    preferences
                  </p>

                </div>

                <div className="border border-border bg-card p-4">

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        System Name
                      </label>

                      <Input
                        value={
                          settings.systemName
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            systemName:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Timezone
                      </label>

                      <Input
                        value={
                          settings.timezone
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            timezone:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Language
                      </label>

                      <Input
                        value={
                          settings.language
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            language:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Refresh Interval
                      </label>

                      <Input
                        type="number"

                        value={
                          settings.refreshInterval
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            refreshInterval:
                              Number(
                                e.target
                                  .value
                              ),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection ===
              "appearance" && (

              <div className="space-y-6">

                <div>

                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    Appearance
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Customize theme and
                    fonts
                  </p>

                </div>

                {/* THEME */}
                <div className="border border-border bg-card p-4">

                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Theme
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* LIGHT */}
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          theme: "light",
                        })
                      }

                      className={cn(
                        "flex flex-col items-center gap-3 border p-6 transition-all",

                        settings.theme ===
                          "light"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      )}
                    >

                      <Sun className="h-8 w-8" />

                      <span>
                        Light
                      </span>

                    </button>

                    {/* DARK */}
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          theme: "dark",
                        })
                      }

                      className={cn(
                        "flex flex-col items-center gap-3 border p-6 transition-all",

                        settings.theme ===
                          "dark"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      )}
                    >

                      <Moon className="h-8 w-8" />

                      <span>
                        Dark
                      </span>

                    </button>

                    {/* SYSTEM */}
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          theme: "system",
                        })
                      }

                      className={cn(
                        "flex flex-col items-center gap-3 border p-6 transition-all",

                        settings.theme ===
                          "system"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      )}
                    >

                      <Monitor className="h-8 w-8" />

                      <span>
                        System
                      </span>

                    </button>
                  </div>
                </div>

                {/* FONT SIZE */}
                <div className="border border-border bg-card p-4">

                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Font Size
                  </h3>

                  <div className="space-y-4">

                    {[
                      "small",
                      "medium",
                      "large",
                    ].map((size) => (

                      <label
                        key={size}

                        className="flex cursor-pointer items-center gap-3"
                      >

                        <input
                          type="radio"
                          name="font"

                          checked={
                            settings.fontSize ===
                            size
                          }

                          onChange={() =>
                            setSettings({
                              ...settings,
                              fontSize:
                                size,
                            })
                          }
                        />

                        <Type
                          className={cn(
                            size ===
                              "small"
                              ? "h-4 w-4"
                              : size ===
                                  "medium"
                                ? "h-5 w-5"
                                : "h-6 w-6"
                          )}
                        />

                        <span className="capitalize">
                          {size}
                        </span>

                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection ===
              "notifications" && (

              <div className="space-y-6">

                <div>

                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    Notifications
                  </h1>

                  <p className="text-sm text-muted-foreground">
                    Configure alerts
                  </p>

                </div>

                <div className="border border-border bg-card p-4">

                  <div className="space-y-4">

                    {[
                      {
                        key:
                          "batteryAlerts",
                        label:
                          "Battery Alerts",
                      },

                      {
                        key:
                          "voltageWarnings",
                        label:
                          "Voltage Warnings",
                      },

                      {
                        key:
                          "mqttNotifications",
                        label:
                          "MQTT Notifications",
                      },

                      {
                        key:
                          "emailNotifications",
                        label:
                          "Email Notifications",
                      },
                    ].map((item) => (

                      <label
                        key={item.key}

                        className="flex items-center gap-3"
                      >

                        <input
                          type="checkbox"

                          checked={
                            settings[
                              item.key as keyof typeof settings
                            ] as boolean
                          }

                          onChange={(e) =>
                            setSettings({
                              ...settings,

                              [item.key]:
                                e.target
                                  .checked,
                            })
                          }

                          className="h-4 w-4"
                        />

                        <span>
                          {item.label}
                        </span>

                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM */}
            {activeSection ===
              "system" && (

              <div className="space-y-6">

                <div>

                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    System Configuration
                  </h1>

                </div>

                <div className="border border-border bg-card p-4">

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        MQTT Broker
                      </label>

                      <Input
                        value={
                          settings.mqttBroker
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            mqttBroker:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        MQTT Port
                      </label>

                      <Input
                        value={
                          settings.mqttPort
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            mqttPort:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Device ID
                      </label>

                      <Input
                        value={
                          settings.deviceId
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            deviceId:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Firmware Version
                      </label>

                      <Input
                        value={
                          settings.firmwareVersion
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            firmwareVersion:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeSection ===
              "security" && (

              <div className="space-y-6">

                <div>

                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    Security
                  </h1>

                </div>

                <div className="border border-border bg-card p-4">

                  <div className="space-y-4">

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Admin Email
                      </label>

                      <Input
                        value={
                          settings.adminEmail
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            adminEmail:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DATABASE */}
            {activeSection ===
              "database" && (

              <div className="space-y-6">

                <div>

                  <h1 className="text-xl font-bold uppercase tracking-wider">
                    Database Settings
                  </h1>

                </div>

                <div className="border border-border bg-card p-4">

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Retention Days
                      </label>

                      <Input
                        type="number"

                        value={
                          settings.retentionDays
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            retentionDays:
                              Number(
                                e.target
                                  .value
                              ),
                          })
                        }
                      />
                    </div>

                    <div>

                      <label className="mb-1 block text-xs text-muted-foreground">
                        Backup Interval
                      </label>

                      <Input
                        value={
                          settings.backupInterval
                        }

                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            backupInterval:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6">

                    <div className="mb-2 flex justify-between text-sm">

                      <span className="text-muted-foreground">
                        Storage Usage
                      </span>

                      <span className="font-mono">
                        2.4 GB / 10 GB
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded bg-muted">

                      <div className="h-full w-[24%] bg-secondary" />

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAVE BUTTON */}
            <div className="mt-8 flex items-center justify-end gap-3">

              {savedMessage && (

                <div className="flex items-center gap-2 text-sm text-green-500">

                  <Check className="h-4 w-4" />

                  Settings Saved

                </div>
              )}

              <Button
                className="gap-2"

                onClick={saveSettings}
              >

                <Save className="h-4 w-4" />

                Save Settings

              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}