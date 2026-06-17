"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  LayoutDashboard,
  Radio,
  LineChart,
  Zap,
  AlertTriangle,
  X,
} from "lucide-react"

import { useEnergyStore } from "@/lib/energy-store"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  {
    href: "/realtime",
    label: "Realtime Nodes",
    icon: Radio,
  },

  {
    href: "/timeseries",
    label: "Time Series",
    icon: LineChart,
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {

  const pathname = usePathname()

  const {
    alerts,
    isConnected,
  } = useEnergyStore()

  const activeAlerts =
    alerts.filter(
      (a) => !a.acknowledged
    ).length

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-sidebar transition-transform duration-300 lg:z-40 lg:translate-x-0",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >

        <div className="flex h-full flex-col">

          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="flex h-10 w-10 items-center justify-center bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wider text-sidebar-foreground">
                SMART WATTS
              </h1>

              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Energy Control
              </p>
            </div>
          </div>

          {/* MQTT Connection */}
          <div className="mx-4 mt-4 flex items-center gap-2 border border-border bg-background/50 px-3 py-2">

            <div
              className={cn(
                "h-2 w-2 animate-pulse rounded-full",
                isConnected
                  ? "bg-secondary"
                  : "bg-destructive"
              )}
            />

            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {isConnected
                ? "Connected"
                : "Disconnected"}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">

            {navItems.map((item) => {

              const isActive =
                pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}

                  onClick={onClose}

                  className={cn(
                    "flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm font-medium transition-all",

                    isActive
                      ? "border-primary bg-primary/20 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent"
                  )}
                >

                  <item.icon className="h-5 w-5" />

                  <span className="uppercase tracking-wide">
                    {item.label}
                  </span>

                  {/* Alert Count */}
                  {item.href === "/" &&
                    activeAlerts > 0 && (
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
                  {activeAlerts} Active Alert
                  {activeAlerts > 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-sidebar-border px-6 py-3">

            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              System v2.1.0 | Node Monitor
            </p>

          </div>
        </div>
      </aside>
    </>
  )
}