'use client'

import Link from 'next/link.js'
import { usePathname } from 'next/navigation.js'

export function HomeChecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRootRoute = pathname === '/'

  return (
    <>
      {!isRootRoute && <Link href="/">Home</Link>}
      {children}
    </>
  )
}
