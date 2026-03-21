import type { Metadata } from 'next'
import './globals.css'
import Footer from './components/Footer'

export const metadata: Metadata = {
  title: 'Copyright Nexus — Your starting point for confident copyright research',
  description: 'Copyright status determination for cultural heritage professionals. Powered by 1.8 million verified renewal records.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Footer />
      </body>
    </html>
  )
}
