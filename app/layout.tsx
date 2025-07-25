import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { NavHeader } from '@/components/nav-header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Talmudic Study App',
  description: 'Navigate interconnected Talmudic texts with real-time translations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <NavHeader />
          {children}
        </Providers>
      </body>
    </html>
  )
}
