'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAnalysisStore } from '@/stores/analysis-store'

const navLinks: { href: string; label: string; requiresResults?: boolean }[] = [
  { href: '/analyze', label: 'Analyze' },
  { href: '/duplicates', label: 'Duplicate Scanner' },
  { href: '/report', label: 'Report', requiresResults: true },
]

export function AppHeader() {
  const pathname = usePathname()
  const results = useAnalysisStore((s) => s.results)

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
        <Link href="/" className="mr-8 text-lg font-bold tracking-tight">
          Beatgrid Master
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => {
            if (link.requiresResults && !results) return null
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
