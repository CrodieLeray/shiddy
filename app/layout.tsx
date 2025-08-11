import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

import './globals.css'

export const metadata: Metadata = {
  title: 'shiddy boiiis',
  description: 'shiddy boiiis',
  generator: 'v0.dev',
  icons: {
    icon: '/shiddy.png',
    shortcut: '/shiddy.png',
    apple: '/shiddy.png',
  },
  openGraph: {
    title: 'shiddy boiiis',
    description: 'shiddy boiiis',
    images: ['/shiddy_red.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'shiddy boiiis',
    description: 'shiddy boiiis',
    images: ['/shiddy_red.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
        `}</style>
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
