import type { Metadata } from 'next'
import './globals.css'
import { Web3Providers } from '@/components/Web3Providers'

export const metadata: Metadata = {
  title: 'StreamMine — Mine SMINE while you stream',
  description: 'The streaming economy token. Earn SMINE by streaming on YouTube.',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#080b10' }}>
      <body style={{ background: '#080b10', color: '#e2e8f0', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  )
}