'use client'

import { useCallback, useState } from 'react'

import type { UnsubscribeResponse } from '../endpoints/unsubscribe.js'

export { UnsubscribeResponse }
import { useSubscriber } from '../contexts/SubscriberProvider.js'
import { useServerUrl } from '../react-hooks/useServerUrl.js'

/** Props for the UseUnsubscribe hook. */
export interface IUseUnsubscribeOptions {
  handleUnsubscribe?: (result: UnsubscribeResponse) => void
}

/** Props for the unsubscribe function. */
export interface IUnsubscribeProps {
  email: string
  hash: string
}

/** Interface for the useUnsubscribe hook's return properties. */
export interface IUseUnsubscribe {
  isError: boolean
  isLoading: boolean
  result: string
  unsubscribe: (props?: IUnsubscribeProps) => Promise<void>
}

/**
 * Handles the unsubscribe action, to be used with unsubscribe URLs in emails, etc.
 * Uses the URL params for email and hash to call /api/unsubscribe to complete the unsubscribe.
 * Allows
 * Displays children provided after unsubscribe is attempted.
 *
 * @param props - See IUseUnsubscribeOptions
 * @param props.handleUnsubscribe - (optional) An event handler called after unsubscribe is attempted
 * @returns The results of the **render** prop function — or a default layout — including loading status,
 *          error status, result message, and component children
 */
export const useUnsubscribe = ({ handleUnsubscribe }: IUseUnsubscribeOptions): IUseUnsubscribe => {
  const { serverURL } = useServerUrl()
  const { refreshSubscriber, subscriber } = useSubscriber()

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

      if (!isError) {
        refreshSubscriber()
      }
      if (handleUnsubscribe) {
        handleUnsubscribe(resultJson)
      }
    },
    [serverURL, handleUnsubscribe, isError, refreshSubscriber, subscriber],
  )

  return { isError, isLoading, result, unsubscribe }
}
