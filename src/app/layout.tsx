import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bedriftssøk - BRREG Enhetsregisteret',
  description: 'Søk etter bedrifter i BRREG Enhetsregisteret',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-3xl font-bold text-foreground">
                Bedriftssøk
              </h1>
              <p className="text-muted-foreground mt-2">
                Søk etter bedrifter i BRREG Enhetsregisteret
              </p>
            </div>
          </header>
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="border-t mt-12">
            <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
              <p>Kilde: Enhetsregisteret (BRREG) – NLOD</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
