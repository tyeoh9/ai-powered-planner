import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Inky: AI writing companion',
  description: 'An AI-powered planning editor with predictive suggestions',
  icons: {
    icon: '/octopus.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${fredoka.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
