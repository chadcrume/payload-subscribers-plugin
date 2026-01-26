'use client'

import type { Subscriber } from '@payload-types'

import { logoutAction, subscriberAuth } from '@server-functions/subscriberAuth.js'
import { type ReactNode, useCallback, useEffect } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'

export type SubscriberContextType = {
  isLoaded: boolean
  logOut: () => void
  permissions: any
  refreshSubscriber: () => void
  subscriber: null | Subscriber
}

const SubscriberContext = createContext<SubscriberContextType | undefined>(undefined)

interface ProviderProps {
  children?: ReactNode // Recommended type for children
}

export function SubscriberProvider({ children }: ProviderProps) {
  // eslint-disable-next-line
  const [subscriber, setSubscriber] = useState<null | (Subscriber & { optIns: string[] })>(null)

  // Keep track of if the selection content is loaded yet
  const [isLoaded, setIsLoaded] = useState(false)

  const [permissions, setPermissions] = useState<any>()

  const initSubscriber = async () => {
    setIsLoaded(false)
    // Call the server function to get the user data
    // @ts-expect-error - error OR user (and permissions) will be undefined
    const { permissions, subscriber } = await subscriberAuth()
    setSubscriber(subscriber)
    setPermissions(permissions)
    setIsLoaded(true)
  }

  const refreshSubscriber = useCallback(async () => {
    await initSubscriber()
  }, [])

  const logOut = useCallback(async () => {
    await logoutAction()
    setSubscriber(null)
    setPermissions(undefined)
  }, [])

  useEffect(() => {
    void initSubscriber()
  }, []) // Empty dependency array for mount/unmount

  // Memoize the value to prevent unnecessary re-renders in consumers
  const contextValue: SubscriberContextType = useMemo(
    () => ({
      isLoaded,
      logOut,
      permissions,
      refreshSubscriber,
      subscriber,
    }),
    [isLoaded, logOut, permissions, refreshSubscriber, subscriber],
  )

  return <SubscriberContext.Provider value={contextValue}>{children}</SubscriberContext.Provider>
}

// Custom hook to easily consume the context and add error handling
export function useSubscriber() {
  const context = useContext(SubscriberContext)
  if (context === undefined) {
    throw new Error('useSubscriber must be used within a SubscriberProvider')
  }
  return context
}
