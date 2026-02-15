'use client'

import { useSearchParams } from 'next/navigation.js'
import { useEffect, useState } from 'react'

import type { RequestMagicLinkResponse } from '../../endpoints/requestMagicLink.js'
import type { VerifyMagicLinkResponse } from '../../endpoints/verifyMagicLink.js'

export { VerifyMagicLinkResponse }
import { RequestMagicLink, useSubscriber } from '../../exports/ui.js'
import { useRequestMagicLink } from '../../hooks/useRequestMagicLink.js'
import { useVerifyMagicLink } from '../../hooks/useVerifyMagicLink.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

/** Props for the VerifyMagicLink component. */
export interface IVerifyMagicLink {
  children?: React.ReactNode
  classNames?: VerifyMagicLinkClasses
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleMagicLinkVerified?: (result: string) => void
  verifyData?: string
}

/** Optional CSS class overrides for VerifyMagicLink elements. */
export type VerifyMagicLinkClasses = {
  button?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  loading?: string
  message?: string
}

/**
 * Handles the verify step of magic-link flow. When URL has email and token query params, calls
 * POST /api/verifyToken to verify and log in; otherwise shows RequestMagicLink. Supports
 * "Request another magic link" via renderButton and optional callbacks.
 *
 * @param props - IVerifyMagicLink
 * @param props.children - (optional) Child ReactNodes to be rendered after verify action
 * @param props.classNames - (optional) Optional additions to the structured CSS elements
 * @param props.handleMagicLinkRequested - (optional) An event handler called after a new magic link is requested
 * @param props.handleMagicLinkVerified - (optional) An event handler called after magic link is verified
 * @returns Shows loading status, error status, result message, and component children. Shows RequestMagicLink when no token/email.
 */
export const VerifyMagicLink = ({
  children,
  classNames = {
    button: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    loading: '',
    message: '',
  },
  handleMagicLinkRequested,
  handleMagicLinkVerified,
  verifyData,
}: IVerifyMagicLink) => {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const { subscriber } = useSubscriber()

  const {
    isError: verifyIsError,
    isLoading: verifyIsLoading,
    result: verifyResult,
    verify,
  } = useVerifyMagicLink()

  useEffect(() => {
    async function asyncVerify() {
      await verify()
    }
    if (!subscriber) {
      void asyncVerify()
    } else {
      setIsError(false)
      setResult('Already logged in')
    }
  }, [subscriber, verify])

  useEffect(() => {
    setResult(verifyResult)
    setIsError(verifyIsError)
    setIsLoading(verifyIsLoading)
    if (!verifyIsError && handleMagicLinkVerified) {
      handleMagicLinkVerified(verifyResult)
    }
  }, [handleMagicLinkVerified, verifyResult, verifyIsError, verifyIsLoading])

  const [result, setResult] = useState<string>()
  const [isError, setIsError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    result: requestResult,
    sendMagicLink,
    status: requestStatus,
  } = useRequestMagicLink({
    handleMagicLinkRequested,
    verifyData,
  })

  useEffect(() => {
    setIsError(requestStatus == 'error')
    setResult(requestResult)
    setIsLoading(false)
  }, [requestResult, requestStatus])

  const handleRequestAnother = () => {
    if (email) {
      void sendMagicLink(email)
    }
  }

  return (
    <>
      {(!email || !token) && <RequestMagicLink classNames={classNames} />}
      {email && token && (
        <div
          className={mergeClassNames([
            'subscribers-verify subscribers-container',
            styles.container,
            classNames.container,
          ])}
        >
          {isLoading && (
            <p
              className={mergeClassNames([
                'subscribers-loading',
                styles.loading,
                classNames.loading,
              ])}
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
          <div className={mergeClassNames(['subscribers-form', styles.form, classNames.form])}>
            {result && isError && (
              <button
                className={mergeClassNames([
                  'subscribers-button',
                  styles.button,
                  classNames.button,
                ])}
                name={'request'}
                onClick={handleRequestAnother}
                type="button"
              >
                {'Request another magic link'}
              </button>
            )}
            {result && children}
          </div>
        </div>
      )}
    </>
  )
}
