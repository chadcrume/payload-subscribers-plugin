'use client'

import { useSearchParams } from 'next/navigation.js'
import { useCallback, useState } from 'react'

import type { VerifyMagicLinkResponse } from '../endpoints/verifyMagicLink.js'

export { VerifyMagicLinkResponse }
import { useSubscriber } from '../contexts/SubscriberProvider.js'
import { useServerUrl } from '../react-hooks/useServerUrl.js'

/** Interface for the Unsubscribe's render function prop. */
export interface IUseVerifyMagicLink {
  isError: boolean
  isLoading: boolean
  result: string
  verify: () => void
}

/**
 * Handles the verify step of magic-link flow. When URL has email and token query params, calls
 * POST /api/verifyToken to verify and log in; otherwise shows RequestMagicLink. Supports
 * "Request another magic link" via renderButton and optional callbacks.
 *
 * @param props - IUseVerifyMagicLinkOptions
 * @param props.handleMagicLinkRequested - (optional) An event handler called after a new magic link is requested
 * @param props.render - (optional) A function to override the default component rendering
 * @returns The results of the **render** prop function — or a default layout — including loading status,
 *          error status, result message, and component children. Returns RequestMagicLink when no token/email.
 */
export const useVerifyMagicLink = () => {
  const { serverURL } = useServerUrl()

  const { refreshSubscriber } = useSubscriber()

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const [result, setResult] = useState<string>()
  const [isError, setIsError] = useState<boolean>(false)
  // const [email, setEmail] = useState('')

  const verify = useCallback(async () => {
    if (!email || !token) {
      return { error: 'Invalid input' }
    }
    try {
      // I tried using PayloadSDK.request, but when the endpoint
      // returns a not-okay status, PayloadSDK.request returns its
      // own "Bad request" error, and doesn't share the endpoint
      // result data.
      const verifyEndpointResult = await fetch(`${serverURL ? serverURL : ''}/api/verifyToken`, {
        body: JSON.stringify({
          email,
          token,
        }),
        method: 'POST',
      })

      if (verifyEndpointResult && verifyEndpointResult.json) {
        const resultJson = await verifyEndpointResult.json()
        setResult(resultJson.error || resultJson.message)
        setIsError(!!resultJson.error)
        // return { error: resultJson.error, message: resultJson.message }
      } else if (verifyEndpointResult && verifyEndpointResult.text) {
        const resultText = await verifyEndpointResult.text()
        setResult(resultText)
        setIsError(true)
      } else {
        setResult(`Error: ${verifyEndpointResult.status}`)
        setIsError(true)
      }
    } catch (error: unknown) {
      setResult(`Error: ${error}`)
      setIsError(true)
    }
    if (!isError) {
      refreshSubscriber()
    }
  }, [email, isError, refreshSubscriber, serverURL, token])

  return {
    isError,
    isLoading: !result,
    result: result || '',
    verify,
  }
}
