import type { Metadata } from 'next'
// import { Geist, Geist_Mono } from 'next/font/google'
// import './globals.css'
import { Lora } from 'next/font/google'
import './globals.css'

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// })

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// })

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI-powered Document',
  description: 'An AI-powered planning editor with predictive suggestions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body> */}
      <body className={`${lora.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
