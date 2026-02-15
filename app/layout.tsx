import React from "react"
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const notoArabic = Noto_Sans_Arabic({ 
  subsets: ["arabic"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic'
});

export const metadata: Metadata = {
  title: 'نظام حلقة القرآن',
  description: 'نظام إدارة حلقة تحفيظ القرآن الكريم - تسجيل تقدم الطلاب',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'حلقة القرآن',
  },
}

export const viewport: Viewport = {
  themeColor: '#047857',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoArabic.className} antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
