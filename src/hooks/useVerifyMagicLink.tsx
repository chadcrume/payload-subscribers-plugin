'use client'

import { useSearchParams } from 'next/navigation.js'
import { useCallback, useState } from 'react'

import type { VerifyMagicLinkResponse } from '../endpoints/verifyMagicLink.js'

export { VerifyMagicLinkResponse }
import { useSubscriber } from '../contexts/SubscriberProvider.js'
import { useServerUrl } from '../react-hooks/useServerUrl.js'

/**
 * Return value of useVerifyMagicLink.
 *
 * @property isError - True if the last verify attempt failed
 * @property isLoading - True until verify has been run and has a result
 * @property result - Result message from the last verify attempt
 * @property verify - Calls POST /api/verifyToken with email and token from URL search params
 */
export interface IUseVerifyMagicLink {
  isError: boolean
  isLoading: boolean
  result: string
  verify: () => void
}

/**
 * Hook for the verify step of the magic-link flow. Reads email and token from URL search params,
 * calls POST /api/verifyToken to verify and log in, and refreshes subscriber on success.
 * Takes no parameters.
 *
 * @returns verify function plus isLoading, isError, and result (see IUseVerifyMagicLink)
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
