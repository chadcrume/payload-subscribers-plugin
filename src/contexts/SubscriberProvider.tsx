'use client'

import { PayloadSDK } from '@payloadcms/sdk'
import { type ReactNode, useCallback, useEffect } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'

import type { Config, Subscriber } from '../copied/payload-types.js'

import { useServerUrl } from '../react-hooks/useServerUrl.js'

/** Value provided by SubscriberProvider: current subscriber, auth state, and actions. */
export type SubscriberContextType = {
  isLoaded: boolean
  logOut: () => void
  permissions: any
  refreshSubscriber: () => void
  subscriber: null | Subscriber
}

const SubscriberContext = createContext<SubscriberContextType | undefined>(undefined)

/** Props for SubscriberProvider. */
interface ProviderProps {
  children?: ReactNode
}

/**
 * Provider that fetches and holds the current subscriber auth state (via POST /api/subscriberAuth).
 * Exposes subscriber, permissions, refreshSubscriber, and logOut to descendants. Must wrap any
 * component that uses useSubscriber().
 *
 * @param props.children - React tree to wrap
 * @returns SubscriberContext.Provider with current auth state and actions
 */
export function SubscriberProvider({ children }: ProviderProps) {
  // eslint-disable-next-line
  const [subscriber, setSubscriber] = useState<null | (Subscriber & { optIns: string[] })>(null)

  const { serverURL } = useServerUrl()

  // Keep track of if the selection content is loaded yet
  const [isLoaded, setIsLoaded] = useState(false)

  const [permissions, setPermissions] = useState<any>()

  const refreshSubscriber = useCallback(async () => {
    const initSubscriber = async () => {
      setIsLoaded(false)
      try {
        const authResponse = await fetch('/api/subscriberAuth', {
          // body: JSON.stringify({}),
          method: 'POST',
        })

        if (authResponse.ok) {
          // Call the server function to get the user data
          const { permissions, subscriber } = await authResponse.json()
          // console.log(`subscriber = `, subscriber)
          // console.log(`permissions = `, permissions)
          setPermissions(permissions)
          setSubscriber(subscriber)
        } else {
          setPermissions(null)
          setSubscriber(null)
        }
      } catch (error: unknown) {
        console.log(`authResponse error`, error)
      }
      setIsLoaded(true)
    }
    await initSubscriber()
  }, [serverURL])

  const logOut = useCallback(async () => {
    setIsLoaded(false)
    try {
      // const sdk = new PayloadSDK<Config>({
      //   baseURL: serverURL || '',
      // })
      // const logoutResponse = await sdk.request({
      //   json: {},
      //   method: 'POST',
      //   path: '/api/logout',
      // })
      // Unsure why sdk isn't working here
      const logoutResponse = await fetch('/api/logout', {
        method: 'POST',
      })

      // console.log(`logoutResponse`, logoutResponse)

      if (logoutResponse.ok) {
        setSubscriber(null)
        setPermissions(null)
      }
    } catch (error: unknown) {
      console.log(`logoutResponse error`, error)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    void refreshSubscriber()
  }, [refreshSubscriber])

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

/**
 * Consumes SubscriberContext. Use only inside a SubscriberProvider.
 *
 * @returns Current subscriber (or null), permissions, isLoaded, refreshSubscriber, and logOut
 * @throws Error if used outside SubscriberProvider
 */
export function useSubscriber() {
  const context = useContext(SubscriberContext)
  if (context === undefined) {
    throw new Error('useSubscriber must be used within a SubscriberProvider')
  }
  return context
}
