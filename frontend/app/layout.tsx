import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Space_Mono } from "next/font/google"

import "./globals.css"

const _sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans"
})

const _mono = Space_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "BeatFlow",
  description: "LLM-powered beats generation with piano roll editor and MIDI export",
}

export const viewport: Viewport = {
  themeColor: "#0d1117",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_sans.variable} ${_mono.variable} font-sans antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}