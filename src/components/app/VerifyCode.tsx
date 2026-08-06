'use client'

import { type ChangeEvent, type SubmitEvent, useState } from 'react'

import type { RequestCodeResponse } from '../../endpoints/requestCode.js'

import { useVerifyCode } from '../../hooks/useVerifyCode.js'
import { mergeClassNames } from './helpers.js'
import { RequestCode } from './RequestCode.js'
import styles from './shared.module.css'

/**
 * Props for the VerifyCode component.
 *
 * @property children - Optional React nodes rendered after a successful verify
 * @property classNames - Optional CSS class overrides for the component elements
 * @property handleCodeRequested - Callback when a login code is requested
 * @property handleCodeVerified - Callback when the login code is verified
 * @property initialEmail - Optional email to pre-fill, skipping straight to the code-entry step
 * (e.g. when arriving from a link that already carried the email in a query param)
 */
export interface IVerifyCode {
  children?: React.ReactNode
  classNames?: VerifyCodeClasses
  handleCodeRequested?: (result: RequestCodeResponse, email: string) => void
  handleCodeVerified?: (result: string) => void
  initialEmail?: string
}

/**
 * Optional CSS class overrides for VerifyCode elements.
 *
 * @property button - Class for buttons
 * @property codeInput - Class for the code input field
 * @property container - Class for the main container
 * @property emailInput - Class for the email input field (used by the request step)
 * @property error - Class for error messages
 * @property form - Class for the form
 * @property loading - Class for loading state
 * @property message - Class for result message text
 */
export type VerifyCodeClasses = {
  button?: string
  codeInput?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  loading?: string
  message?: string
}

/**
 * Handles the full login-code flow in a single component. Unlike VerifyMagicLink, this isn't
 * driven by URL search params — a typed-in code has no URL — so it tracks its own two-step state:
 * first it shows RequestCode to collect an email and send the code, then once an email has been
 * submitted it shows a code-entry form that calls POST /api/verifyCode to verify and log in.
 *
 * @param props - Component props (see IVerifyCode)
 * @param props.children - Optional React nodes rendered after a successful verify
 * @param props.classNames - Optional class overrides for the component elements
 * @param props.handleCodeRequested - Callback when a login code is requested
 * @param props.handleCodeVerified - Callback when the login code is verified
 * @returns RequestCode until an email has been submitted, then a code-entry form with loading/result state
 */
export const VerifyCode = ({
  children,
  classNames = {
    button: '',
    codeInput: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    loading: '',
    message: '',
  },
  handleCodeRequested,
  handleCodeVerified,
  initialEmail,
}: IVerifyCode) => {
  const [email, setEmail] = useState<string | undefined>(initialEmail)
  const [code, setCode] = useState('')

  const { isError, isLoading, result, status, verify } = useVerifyCode()

  const handleRequested = (result: RequestCodeResponse, requestedEmail: string) => {
    setEmail(requestedEmail)
    if (handleCodeRequested) {
      handleCodeRequested(result, requestedEmail)
    }
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) {
      return
    }
    const outcome = await verify(email, code)
    if (!outcome.error && handleCodeVerified) {
      handleCodeVerified(outcome.message || '')
    }
  }

  if (!email) {
    return <RequestCode classNames={classNames} handleCodeRequested={handleRequested} />
  }

  return (
    <div
      className={mergeClassNames([
        'subscribers-verify subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      {isLoading && (
        <p
          className={mergeClassNames(['subscribers-loading', styles.loading, classNames.loading])}
        >
          verifying...
        </p>
      )}
      {!isLoading && result && (
        <p
          className={mergeClassNames([
            'subscribers-message',
            styles.message,
            classNames.message,
            isError ? ['subscribers-error', styles.error, classNames.error] : [],
          ])}
        >
          {result}
        </p>
      )}
      {status != 'verified' && (
        <form
          className={mergeClassNames(['subscribers-form', styles.form, classNames.form])}
          method="POST"
          onSubmit={handleSubmit}
        >
          <input
            aria-label="enter your login code"
            className={mergeClassNames([
              'subscribers-codeInput',
              styles.emailInput,
              classNames.codeInput,
            ])}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
            placeholder="enter your code"
            type="text"
            value={code}
          />
          <button
            className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
            type="submit"
          >
            Verify code
          </button>
          <button
            className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
            onClick={() => setEmail(undefined)}
            type="button"
          >
            Use a different email
          </button>
        </form>
      )}
      {status == 'verified' && children}
    </div>
  )
}
