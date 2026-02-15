'use client'

import { useState } from 'react'

import type { RequestMagicLinkResponse } from '../endpoints/requestMagicLink.js'

import { useServerUrl } from '../react-hooks/useServerUrl.js'

export { RequestMagicLinkResponse }

/**
 * Options for the useRequestMagicLink hook.
 *
 * @property handleMagicLinkRequested - Callback when a magic link is successfully requested
 * @property verifyData - Optional data sent with the request (e.g. for verification redirect)
 */
export interface IUseRequestMagicLinkOptions {
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  verifyData?: string
}

/**
 * Return value of useRequestMagicLink.
 *
 * @property result - Success or error message from the last request
 * @property sendMagicLink - Sends a magic link email for the given address
 * @property status - Current status: 'default' | 'sending' | 'sent' | 'error'
 */
export interface IUseRequestMagicLink {
  result?: string
  sendMagicLink: (email: string) => Promise<void>
  status?: RequestMagicLinkStatusValue
}

export type RequestMagicLinkStatusValue = 'default' | 'error' | 'sending' | 'sent'

/**
 * Hook to request a magic-login link by email. Calls POST /api/emailToken and exposes
 * sendMagicLink, plus result message and status for UI.
 *
 * @param options - Hook options (see IUseRequestMagicLinkOptions)
 * @param options.handleMagicLinkRequested - Callback when a magic link is successfully requested
 * @param options.verifyData - Optional data sent with the request (e.g. for verification redirect)
 * @returns sendMagicLink function, result message, and status (see IUseRequestMagicLink)
 */
export const useRequestMagicLink = ({
  handleMagicLinkRequested,
  verifyData,
}: IUseRequestMagicLinkOptions): IUseRequestMagicLink => {
  const { serverURL } = useServerUrl()

  const [status, setStatus] = useState<RequestMagicLinkStatusValue>('default')
  const [result, setResult] = useState<string>()

  const sendMagicLink = async (email: string): Promise<void> => {
    setStatus('sending')
    const emailTokenResponse = await fetch(`${serverURL ? serverURL : ''}/api/emailToken`, {
      body: JSON.stringify({
        email,
        verifyData,
      }),
      method: 'POST',
    })
    if (emailTokenResponse.ok) {
      const emailTokenResponseJson: RequestMagicLinkResponse = await emailTokenResponse.json()
      if (handleMagicLinkRequested) {
        handleMagicLinkRequested(emailTokenResponseJson)
      }
      // @ts-expect-error One or the other exists
      const { emailResult, error } = emailTokenResponseJson
      if (error) {
        setStatus('error')
        setResult(`An error occured. Please try again. \n ${error?.error ? error.error : error}`)
      } else if (emailResult) {
        setStatus('sent')
        setResult('An email has been sent containing your magic link.')
      } else {
        setStatus('error')
        setResult(`An error occured. Please try again. \nResult unknown`)
      }
    } else {
      try {
        const emailTokenResponseJson = await emailTokenResponse.json()
        setStatus('error')
        setResult(
          `An error occured. Please try again. \n${emailTokenResponseJson?.error ? emailTokenResponseJson.error : emailTokenResponseJson}`,
        )
      } catch (ignore) {
        const emailTokenResponseText = await emailTokenResponse.text()
        setStatus('error')
        setResult(`An error occured. Please try again. \n${emailTokenResponseText}`)
      }
    }
  }
  return {
    result,
    sendMagicLink,
    status,
  }
}
