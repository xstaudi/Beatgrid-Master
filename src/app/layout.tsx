import type { Metadata } from 'next'
import { Marcellus, Josefin_Sans } from 'next/font/google'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/layout/AppHeader'

const marcellus = Marcellus({
  weight: '400',
  variable: '--font-marcellus',
  subsets: ['latin'],
})

const josefinSans = Josefin_Sans({
  variable: '--font-josefin-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Beatgrid Master',
  description: 'DJ Library Analyzer — Beatgrid Check, BPM Verification, Key Detection & more',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${marcellus.variable} ${josefinSans.variable} ${geistMono.variable} antialiased`}>
        <AppHeader />
        {children}
      </body>
    </html>
  )
}
