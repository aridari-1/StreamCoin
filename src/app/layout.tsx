import type { Metadata } from 'next'
import './globals.css'
import { Web3Providers } from '@/components/Web3Providers'

export const metadata: Metadata = {
  title: 'StreamCoin — Mine STMC while you stream',
  description: 'The streaming economy token. Earn STMC by streaming on YouTube.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f1117] text-gray-100 antialiased min-h-screen">
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  )
}
