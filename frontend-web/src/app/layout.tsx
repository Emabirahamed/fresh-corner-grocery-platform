import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ফ্রেশ কর্নার',
  description: 'তাজা পণ্য, দ্রুত ডেলিভারি',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  )
}
