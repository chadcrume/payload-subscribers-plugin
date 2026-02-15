'use client'

import { useCallback, useState } from 'react'

import type { UnsubscribeResponse } from '../endpoints/unsubscribe.js'

export { UnsubscribeResponse }
import { useSubscriber } from '../contexts/SubscriberProvider.js'
import { useServerUrl } from '../react-hooks/useServerUrl.js'

/**
 * Options for the useUnsubscribe hook.
 *
 * @property handleUnsubscribe - Callback when unsubscribe is attempted (success or error)
 */
export interface IUseUnsubscribeOptions {
  handleUnsubscribe?: (result: UnsubscribeResponse) => void
}

/**
 * Arguments for the unsubscribe function when calling it with email/hash explicitly.
 *
 * @property email - Subscriber email
 * @property hash - Unsubscribe token (from email link)
 */
export interface IUnsubscribeProps {
  email: string
  hash: string
}

/**
 * Return value of useUnsubscribe.
 *
 * @property isError - True if the last unsubscribe attempt failed
 * @property isLoading - True while an unsubscribe request is in progress
 * @property result - Result message from the last attempt
 * @property unsubscribe - Calls POST /api/unsubscribe; optional props or uses subscriber from context
 */
export interface IUseUnsubscribe {
  isError: boolean
  isLoading: boolean
  result: string
  unsubscribe: (props?: IUnsubscribeProps) => Promise<void>
}

/**
 * Hook to perform unsubscribe. Calls POST /api/unsubscribe with email and token (from args or
 * subscriber context). For use with unsubscribe URLs in emails, etc.
 *
 * @param options - Hook options (see IUseUnsubscribeOptions)
 * @param options.handleUnsubscribe - Callback when unsubscribe is attempted (success or error)
 * @returns unsubscribe function plus isLoading, isError, and result (see IUseUnsubscribe)
 */
export const useUnsubscribe = ({ handleUnsubscribe }: IUseUnsubscribeOptions): IUseUnsubscribe => {
  const { serverURL } = useServerUrl()
  const { subscriber } = useSubscriber()

  const [result, setResult] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const unsubscribe = useCallback(
    async (props?: IUnsubscribeProps) => {
      let email: string | undefined
      let hash: string | undefined
      let resultJson: UnsubscribeResponse

      if (!props) {
        if (subscriber?.email) {
          email = subscriber?.email
        }
      } else {
        email = props.email
        hash = props.hash
      }
      if (!email || !hash) {
        resultJson = { error: 'Invalid input', now: new Date().toISOString() }
      }
      setIsLoading(true)

      try {
        const unsubscribeEndpointResult = await fetch(
          `${serverURL ? serverURL : ''}/api/unsubscribe`,
          {
            body: JSON.stringify({
              email,
              unsubscribeToken: hash,
            }),
            method: 'POST',
          },
        )

        if (unsubscribeEndpointResult && unsubscribeEndpointResult.json) {
          resultJson = await unsubscribeEndpointResult.json()
        } else if (unsubscribeEndpointResult && unsubscribeEndpointResult.text) {
          const resultText = await unsubscribeEndpointResult.text()
          resultJson = { error: resultText, now: new Date().toISOString() }
        } else {
          resultJson = {
            error: `${unsubscribeEndpointResult.status}`,
            now: new Date().toISOString(),
          }
        }
      } catch (error: any) {
        resultJson = { error, now: new Date().toISOString() }
      }

      // @ts-expect-error Linter doesn't recognize the OR typing
      const { error, message } = resultJson
      setResult(message || `An error occured. Please try again. (${error})`)
      setIsError(error && !message)
      setIsLoading(false)

      if (handleUnsubscribe) {
        handleUnsubscribe(resultJson)
      }
    },
    [serverURL, handleUnsubscribe, subscriber],
  )

  return { isError, isLoading, result, unsubscribe }
}
