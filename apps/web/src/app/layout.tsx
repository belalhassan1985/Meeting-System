import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import '@livekit/components-styles'
import { Providers } from '@/components/providers'

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'نظام الاجتماعات',
  description: 'نظام اجتماعات فيديو متقدم للشبكات المحلية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cairo.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
