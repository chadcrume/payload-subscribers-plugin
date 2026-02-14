'use client'

import { useState } from 'react'

import type { RequestMagicLinkResponse } from '../endpoints/requestMagicLink.js'

import { useServerUrl } from '../react-hooks/useServerUrl.js'

export { RequestMagicLinkResponse }

/**
 * Options for the RequestMagicLink component.
 */
export interface IUseRequestMagicLinkOptions {
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  verifyData?: string
}

/** Interface for useSubscribe props. */
export interface IUseRequestMagicLink {
  result?: string
  sendMagicLink: (email: string) => Promise<void>
  status?: RequestMagicLinkStatusValue
}

export type RequestMagicLinkStatusValue = 'default' | 'error' | 'sending' | 'sent'

/**
 * Form component that lets users request a magic-login link by email. Submits to POST /api/emailToken
 * and shows success or error message. Uses SubscriberProvider for pre-filling email when available.
 *
 * @param props - See IUseRequestMagicLinkOptions
 * @returns Form UI with email input and "Request magic link" button
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
