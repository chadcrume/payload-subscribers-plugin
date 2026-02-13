'use client'

import { type ChangeEvent, type SubmitEvent, useEffect, useState } from 'react'

import type { RequestMagicLinkResponse } from '../../endpoints/requestMagicLink.js'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import { useServerUrl } from '../../react-hooks/useServerUrl.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

export { RequestMagicLinkResponse }

/**
 * Props for the RequestMagicLink component.
 */
export interface IRequestMagicLink {
  classNames?: RequestMagicLinkClasses
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  props?: any
  verifyUrl?: string | URL
}

/** Optional CSS class overrides for RequestMagicLink elements. */
export type RequestMagicLinkClasses = {
  button?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  message?: string
}

type statusValues = 'default' | 'error' | 'sent'

/**
 * Form component that lets users request a magic-login link by email. Submits to POST /api/emailToken
 * and shows success or error message. Uses SubscriberProvider for pre-filling email when available.
 *
 * @param props - See IRequestMagicLink
 * @returns Form UI with email input and "Request magic link" button
 */
export const RequestMagicLink = ({
  classNames = {
    button: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    message: '',
  },
  handleMagicLinkRequested,
  verifyUrl,
}: IRequestMagicLink) => {
  const { subscriber } = useSubscriber()
  const { serverURL } = useServerUrl()

  if (!verifyUrl && serverURL) {
    console.log('verifyUrl DEFAULT')
    verifyUrl = `${serverURL ? serverURL : ''}/verify`
  }
  if (typeof verifyUrl == 'string') {
    console.log('verifyUrl STRING: ', verifyUrl)
    verifyUrl = new URL(verifyUrl)
  }

  const [status, setStatus] = useState<statusValues>('default')

  const [result, setResult] = useState<string>()
  const [email, setEmail] = useState(subscriber?.email || '')

  useEffect(() => {
    setEmail(subscriber?.email || '')
  }, [subscriber])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!verifyUrl) {
      setStatus('error')
      setResult(`An error occured. Please try again. \n(No verify URL available.)`)
    } else {
      // const emailTokenResponse = await sdk.request({
      //   json: {
      //     email,
      //     verifyUrl: verifyUrl?.href,
      //   },
      //   method: 'POST',
      //   path: '/api/emailToken',
      // })
      const emailTokenResponse = await fetch(`${serverURL ? serverURL : ''}/api/emailToken`, {
        body: JSON.stringify({
          email,
          verifyUrl: verifyUrl?.href,
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
        } catch (error) {
          const emailTokenResponseText = await emailTokenResponse.text()
          setStatus('error')
          setResult(`An error occured. Please try again. 2 \n${emailTokenResponseText}`)
        }
      }
    }
  }
  return (
    <div
      className={mergeClassNames([
        'subscribers-request subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      {result ? (
        <p
          className={mergeClassNames([
            'subscribers-message',
            styles.message,
            classNames.message,
            status == 'error' ? ['subscribers-error', styles.error, classNames.error] : [],
          ])}
        >
          {result}
        </p>
      ) : (
        <></>
      )}
      <form
        className={mergeClassNames(['subscribers-form', styles.form, classNames.form])}
        method="POST"
        onSubmit={handleSubmit}
      >
        <input
          aria-label="enter your email"
          className={mergeClassNames([
            'subscribers-emailInput',
            styles.emailInput,
            classNames.emailInput,
          ])}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="enter your email"
          type="email"
          value={email}
        />
        <button
          className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
          type="submit"
        >
          Request magic link
        </button>
      </form>
    </div>
  )
}
