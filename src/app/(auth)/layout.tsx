/**
 * Auth Layout
 *
 * Layout for unauthenticated pages (login, signup, password reset, etc.)
 * Provides a centered, minimal design suitable for auth forms.
 */

import { Inter } from 'next/font/google'
import Link from 'next/link'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Authentication | True Champion',
  description: 'Sign in or create an account to access True Champion',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="relative min-h-screen flex flex-col">
          {/* Header with Logo */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-bold text-xl">True Champion</span>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t py-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} True Champion. All rights reserved.
              </p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <Link href="/terms" className="hover:underline">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:underline">
                  Privacy
                </Link>
                <Link href="/help" className="hover:underline">
                  Help
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
