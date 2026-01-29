'use client'

import { PayloadSDK } from '@payloadcms/sdk'
import { type ReactNode, useCallback, useEffect } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'

import type { Config, Subscriber } from '../copied/payload-types.js'

import { useServerUrl } from '../react-hooks/useServerUrl.js'

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

  const { serverURL } = useServerUrl()

  // Keep track of if the selection content is loaded yet
  const [isLoaded, setIsLoaded] = useState(false)

  const [permissions, setPermissions] = useState<any>()

  const refreshSubscriber = useCallback(async () => {
    const initSubscriber = async () => {
      setIsLoaded(false)
      const sdk = new PayloadSDK<Config>({
        baseURL: serverURL || '',
      })
      const authResponse = await sdk.request({
        json: {},
        method: 'POST',
        path: '/api/subscriberAuth',
      })

      console.log(`authResponse`, authResponse)

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
      setIsLoaded(true)
    }
    await initSubscriber()
  }, [serverURL])

  const logOut = useCallback(async () => {
    setIsLoaded(false)
    const sdk = new PayloadSDK<Config>({
      baseURL: serverURL || '',
    })
    const logoutResponse = await sdk.request({
      json: {},
      method: 'POST',
      path: '/api/logout',
    })

    console.log(`logoutResponse`, logoutResponse)

    if (logoutResponse.ok) {
      setSubscriber(null)
      setPermissions(null)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    void refreshSubscriber()
  }, [refreshSubscriber]) // Empty dependency array for mount/unmount

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
