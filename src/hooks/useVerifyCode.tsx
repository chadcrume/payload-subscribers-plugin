'use client'

import { useCallback, useState } from 'react'

import type { VerifyCodeResponse } from '../endpoints/verifyCode.js'

export { VerifyCodeResponse }
import { useSubscriber } from '../contexts/SubscriberProvider.js'
import { useServerUrl } from '../react-hooks/useServerUrl.js'

type VerifyStatus = 'default' | 'error' | 'verified' | 'verifying'

/**
 * Return value of useVerifyCode.
 *
 * @property isError - True if the last verify attempt failed
 * @property isLoading - True while a verify attempt is in flight
 * @property result - Result message from the last verify attempt
 * @property verify - Calls POST /api/verifyCode with the given email and code
 */
export interface IUseVerifyCode {
  isError: boolean
  isLoading: boolean
  result: string
  status: VerifyStatus
  verify: (email: string, code: string) => Promise<{ error?: string; message?: string }>
}

/**
 * Hook for the verify step of the login-code flow. Unlike the magic-link flow, the email and
 * code are not read from URL search params — the caller passes them explicitly (e.g. from a
 * form), since a typed-in code has no URL of its own. Calls POST /api/verifyCode to verify and
 * log in, and refreshes subscriber on success. Takes no parameters.
 *
 * @returns verify function plus isLoading, isError, and result (see IUseVerifyCode)
 */
export const useVerifyCode = (): IUseVerifyCode => {
  const { serverURL } = useServerUrl()

  const { refreshSubscriber } = useSubscriber()

  const [result, setResult] = useState<string>()
  const [status, setStatus] = useState<VerifyStatus>('default')
  const [isError, setIsError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const verify = useCallback(
    async (email: string, code: string) => {
      setStatus('verifying')
      setIsLoading(true)
      if (!email || !code) {
        setIsError(true)
        setResult('Invalid input')
        setStatus('error')
        setIsLoading(false)
        return { error: 'Invalid input' }
      }
      let outcome: { error?: string; message?: string }
      try {
        const verifyEndpointResult = await fetch(`${serverURL ? serverURL : ''}/api/verifyCode`, {
          body: JSON.stringify({
            code,
            email,
          }),
          method: 'POST',
        })

        if (verifyEndpointResult && verifyEndpointResult.json) {
          const resultJson = await verifyEndpointResult.json()
          outcome = { error: resultJson.error, message: resultJson.message }
          setIsError(!!resultJson.error)
          setResult(resultJson.error || resultJson.message)
          setStatus(resultJson.error ? 'error' : 'verified')
        } else if (verifyEndpointResult && verifyEndpointResult.text) {
          const resultText = await verifyEndpointResult.text()
          outcome = { error: resultText }
          setIsError(true)
          setResult(resultText)
          setStatus('error')
        } else {
          outcome = { error: `Error: ${verifyEndpointResult.status}` }
          setIsError(true)
          setResult(outcome.error)
          setStatus('error')
        }
      } catch (error: unknown) {
        outcome = { error: `Error: ${error}` }
        setIsError(true)
        setResult(outcome.error)
        setStatus('error')
      }
      setIsLoading(false)
      if (!outcome.error) {
        refreshSubscriber()
      }
      return outcome
    },
    [refreshSubscriber, serverURL],
  )

  return {
    isError,
    isLoading,
    result: result || '',
    status,
    verify,
  }
}
