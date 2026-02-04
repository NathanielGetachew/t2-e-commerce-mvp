import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/components/providers/cart-provider"

import { Inter, Plus_Jakarta_Sans as V0_Font_Plus_Jakarta_Sans, IBM_Plex_Mono as V0_Font_IBM_Plex_Mono, Lora as V0_Font_Lora } from 'next/font/google'

// Initialize fonts
const _plusJakartaSans = V0_Font_Plus_Jakarta_Sans({ subsets: ['latin'], weight: ["200", "300", "400", "500", "600", "700", "800"] })
const _ibmPlexMono = V0_Font_IBM_Plex_Mono({ subsets: ['latin'], weight: ["100", "200", "300", "400", "500", "600", "700"] })
const _lora = V0_Font_Lora({ subsets: ['latin'], weight: ["400", "500", "600", "700"] })

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "T2 - China to Ethiopia. Simplified.",
  description: "Import goods from China to Ethiopia with time and trust.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
