"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Radio, LineChart, FileText, Settings, Zap, AlertTriangle, X, Wifi, WifiOff } from "lucide-react"
import { useEnergyStore } from "@/lib/energy-store"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/realtime", label: "Live Data", icon: Radio },
  { href: "/timeseries", label: "History", icon: LineChart },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { alerts, connection } = useEnergyStore()
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-sidebar transition-transform duration-300 lg:z-40 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider text-sidebar-foreground">IoT ENERGY</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dashboard</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mx-4 mt-4 space-y-2">
            <div className="flex items-center gap-2 border border-border bg-background/50 px-3 py-2">
              {connection.mqtt ? (
                <Wifi className="h-4 w-4 text-secondary" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                MQTT: {connection.mqtt ? "Connected" : "Disconnected"}
              </span>
              <div className={cn("ml-auto h-2 w-2", connection.mqtt ? "animate-pulse bg-secondary" : "bg-destructive")} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all",
                    "border border-transparent",
                    isActive
                      ? "border-primary bg-primary/20 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent",
                  )}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="uppercase tracking-wide">{item.label}</span>
                  {item.href === "/" && activeAlerts > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {activeAlerts}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Alert Summary */}
          {activeAlerts > 0 && (
            <div className="mx-4 mb-4 border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {activeAlerts} Active Alert{activeAlerts > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Data Sources Info */}
          <div className="mx-4 mb-4 border border-border bg-background/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Sources</p>
            <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
              <p>MQTT: broker.emqx.io</p>
              <p>Topic: battery/data</p>
              <div className="pt-1 border-t border-border mt-1">
                <p className="font-semibold">ThingSpeak Channels:</p>
                <div className="flex items-center gap-1 mt-1">
                  <span>AC:</span>
                  <a 
                    href="https://thingspeak.mathworks.com/channels/3387437" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    #3387437
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <span>DC:</span>
                  <a 
                    href="https://thingspeak.mathworks.com/channels/3387439" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline"
                  >
                    #3387439
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="border-t border-sidebar-border px-6 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              IoT Dashboard v1.0 | Hardware Integration
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
