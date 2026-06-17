import type React from "react"
import type { Metadata, Viewport } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const oxanium = Oxanium({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] })
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

import { Oxanium, Source_Code_Pro, Oxanium as V0_Font_Oxanium, Source_Code_Pro as V0_Font_Source_Code_Pro, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _oxanium = V0_Font_Oxanium({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800"] })
const _sourceCodePro = V0_Font_Source_Code_Pro({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: "Smart Watts - Energy Monitoring System",
  description: "IoT-based Energy Monitoring & Optimization System for Solar Microgrids",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${oxanium.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
