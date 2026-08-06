'use client'

import { useState } from 'react'

import type { RequestCodeResponse } from '../endpoints/requestCode.js'

import { useServerUrl } from '../react-hooks/useServerUrl.js'

export { RequestCodeResponse }

/**
 * Options for the useRequestCode hook.
 *
 * @property handleCodeRequested - Callback when a login code is successfully requested. Receives
 * the endpoint result plus the email the code was sent to.
 */
export interface IUseRequestCodeOptions {
  handleCodeRequested?: (result: RequestCodeResponse, email: string) => void
}

/**
 * Return value of useRequestCode.
 *
 * @property result - Success or error message from the last request
 * @property sendCode - Sends a login-code email for the given address
 * @property status - Current status: 'default' | 'sending' | 'sent' | 'error'
 */
export interface IUseRequestCode {
  result?: string
  sendCode: (email: string) => Promise<void>
  status?: RequestCodeStatusValue
}

export type RequestCodeStatusValue = 'default' | 'error' | 'sending' | 'sent'

/**
 * Hook to request a one-time login code by email. Calls POST /api/emailCode and exposes
 * sendCode, plus result message and status for UI.
 *
 * @param options - Hook options (see IUseRequestCodeOptions)
 * @param options.handleCodeRequested - Callback when a login code is successfully requested
 * @returns sendCode function, result message, and status (see IUseRequestCode)
 */
export const useRequestCode = ({
  handleCodeRequested,
}: IUseRequestCodeOptions): IUseRequestCode => {
  const { serverURL } = useServerUrl()

  const [status, setStatus] = useState<RequestCodeStatusValue>('default')
  const [result, setResult] = useState<string>()

  const sendCode = async (email: string): Promise<void> => {
    setStatus('sending')
    const emailCodeResponse = await fetch(`${serverURL ? serverURL : ''}/api/emailCode`, {
      body: JSON.stringify({
        email,
      }),
      method: 'POST',
    })
    if (emailCodeResponse.ok) {
      const emailCodeResponseJson: RequestCodeResponse = await emailCodeResponse.json()
      if (handleCodeRequested) {
        handleCodeRequested(emailCodeResponseJson, email)
      }
      // @ts-expect-error One or the other exists
      const { emailResult, error } = emailCodeResponseJson
      if (error) {
        setStatus('error')
        setResult(
          `An error occured. Please try again. \n ${JSON.stringify(error?.error ? error.error : error, undefined, 2)}`,
        )
      } else if (emailResult) {
        setStatus('sent')
        setResult('An email has been sent containing your login code.')
      } else {
        setStatus('error')
        setResult(`An error occured. Please try again. \nResult unknown`)
      }
    } else {
      try {
        const emailCodeResponseJson = await emailCodeResponse.json()
        setStatus('error')
        setResult(
          `An error occured. Please try again. \n${JSON.stringify(emailCodeResponseJson?.error ? emailCodeResponseJson.error : emailCodeResponseJson, undefined, 2)}`,
        )
      } catch (ignore) {
        const emailCodeResponseText = await emailCodeResponse.text()
        setStatus('error')
        setResult(`An error occured. Please try again. \n${emailCodeResponseText}`)
      }
    }
  }
  return {
    result,
    sendCode,
    status,
  }
}
