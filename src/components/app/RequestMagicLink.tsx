'use client'

import { type ChangeEvent, type SubmitEvent, useEffect, useState } from 'react'

import type { RequestMagicLinkResponse } from '../../endpoints/requestMagicLink.js'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import { useRequestMagicLink } from '../../hooks/useRequestMagicLink.js'
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
  verifyData?: string
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
  verifyData,
}: IRequestMagicLink) => {
  const { subscriber } = useSubscriber()
  const { result, sendMagicLink, status } = useRequestMagicLink({
    handleMagicLinkRequested,
    verifyData,
  })

  const [email, setEmail] = useState(subscriber?.email || '')

  useEffect(() => {
    setEmail(subscriber?.email || '')
  }, [subscriber])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    await sendMagicLink(email)
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
