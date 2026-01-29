'use client'

import Link from 'next/link.js'
import { usePathname } from 'next/navigation.js'

export function HomeChecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isRootRoute = pathname === '/'

  // Example: Conditionally render something or pass the state to children
  return (
    <>
      {!isRootRoute && <Link href="/">Home</Link>}
      {children}
    </>
  )
}
