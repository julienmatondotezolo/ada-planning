import { Inter } from 'next/font/google'
import './globals.css'
import { PWARegistration } from '@/components/PWARegistration'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AdaPlanning - Staff Scheduling System',
  description: 'Digital replica of Jessica\'s paper calendar system for L\'Osteria Deerlijk',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <PWARegistration />
        {children}
      </body>
    </html>
  )
}