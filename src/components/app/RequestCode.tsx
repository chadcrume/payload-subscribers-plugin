'use client'

import { type ChangeEvent, type SubmitEvent, useEffect, useState } from 'react'

import type { RequestCodeResponse } from '../../endpoints/requestCode.js'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import { useRequestCode } from '../../hooks/useRequestCode.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

export { RequestCodeResponse }

/**
 * Props for the RequestCode component.
 *
 * @property classNames - Optional CSS class overrides for the component elements
 * @property handleCodeRequested - Callback when a login code is requested. Receives the endpoint
 * result plus the email the code was sent to.
 */
export interface IRequestCode {
  classNames?: RequestCodeClasses
  handleCodeRequested?: (result: RequestCodeResponse, email: string) => void
}

/**
 * Optional CSS class overrides for RequestCode elements.
 *
 * @property button - Class for the submit button
 * @property container - Class for the main container
 * @property emailInput - Class for the email input field
 * @property error - Class for error messages
 * @property form - Class for the form
 * @property message - Class for success/error message text
 */
export type RequestCodeClasses = {
  button?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  message?: string
}

/**
 * Form component that lets users request a one-time login code by email. Submits to
 * POST /api/emailCode and shows success or error message. Uses SubscriberProvider for
 * pre-filling email when available.
 *
 * @param props - Component props (see IRequestCode)
 * @param props.classNames - Optional class overrides for the component elements
 * @param props.handleCodeRequested - Callback when a login code is requested
 * @returns Form UI with email input and "Send login code" button
 */
export const RequestCode = ({
  classNames = {
    button: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    message: '',
  },
  handleCodeRequested,
}: IRequestCode) => {
  const { subscriber } = useSubscriber()
  const { result, sendCode, status } = useRequestCode({
    handleCodeRequested,
  })

  const [email, setEmail] = useState(subscriber?.email || '')

  useEffect(() => {
    setEmail(subscriber?.email || '')
  }, [subscriber])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    await sendCode(email)
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
          Send login code
        </button>
      </form>
    </div>
  )
}
