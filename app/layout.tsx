import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zenodoro',
  description: 'Focus and productivity with Zenodoro',
  keywords: ['productivity', 'focus', 'pomodoro', 'zenodoro'],
  authors: [{ name: 'Pyrodev', url: 'https://pyrodev.it' }],
  creator: 'Pyrodev',
  openGraph: {
    title: 'Zenodoro',
    description: 'Focus and productivity with Zenodoro',
    url: 'https://pyrodev.it/zenodoro',
    siteName: 'Pyrodev Zenodoro',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
