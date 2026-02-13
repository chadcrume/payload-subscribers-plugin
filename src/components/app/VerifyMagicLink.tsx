'use client'

import { useSearchParams } from 'next/navigation.js'
import { useCallback, useEffect, useState } from 'react'

import type { RequestMagicLinkResponse } from '../../endpoints/requestMagicLink.js'
import type { VerifyMagicLinkResponse } from '../../endpoints/verifyMagicLink.js'

export { VerifyMagicLinkResponse }
import { RequestMagicLink, useSubscriber } from '../../exports/ui.js'
import { isAbsoluteURL } from '../../helpers/utilities.js'
import { useServerUrl } from '../../react-hooks/useServerUrl.js'
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
  handleMagicLinkVerified?: (result: VerifyMagicLinkResponse) => void
  render?: (props: IUnsubscribeRenderProps) => React.ReactNode
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

/** Interface for the Unsubscribe's render function prop. */
export interface IUnsubscribeRenderProps {
  children?: React.ReactNode
  handleRequestAnother?: () => void
  isError: boolean
  isLoading: boolean
  result: string
}

/**
 * Handles the verify step of magic-link flow. When URL has email and token query params, calls
 * POST /api/verifyToken to verify and log in; otherwise shows RequestMagicLink. Supports
 * "Request another magic link" via renderButton and optional callbacks.
 *
 * @param props - IVerifyMagicLink
 * @param props.children - (optional) Child ReadNodes to be rendered in the render function
 * @param props.classNames - (optional) Optional additions to the structured CSS elements
 * @param props.handleMagicLinkRequested - (optional) An event handler called after a new magic link is requested
 * @param props.handleMagicLinkVerified - (optional) An event handler called after magic link is verified
 * @param props.render - (optional) A function to override the default component rendering
 * @returns The results of the **render** prop function — or a default layout — including loading status,
 *          error status, result message, and component children. Returns RequestMagicLink when no token/email.
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
  render,
  verifyData,
}: IVerifyMagicLink) => {
  // Set up a default render function, used if there's not one in the props,
  // taking advantage of scope to access styles and classNames
  const defaultRender = ({
    children,
    handleRequestAnother,
    isError = false,
    isLoading = true,
    result = '',
  }: IUnsubscribeRenderProps): React.ReactNode => (
    <div
      className={mergeClassNames([
        'subscribers-verify subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      {isLoading && (
        <p className={mergeClassNames(['subscribers-loading', styles.loading, classNames.loading])}>
          verifying...
        </p>
      )}
      {!isLoading && (
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
            className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
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
  )

  if (!render) {
    render = defaultRender
  }

  const { serverURL } = useServerUrl()
  const {
    // refreshSubscriber,
    subscriber,
  } = useSubscriber()

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const [result, setResult] = useState<string>()
  const [isError, setIsError] = useState<boolean>(false)
  // const [email, setEmail] = useState('')

  const { refreshSubscriber } = useSubscriber()

  const callVerify = useCallback(async () => {
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

      // return verifyEndpointResult
      if (verifyEndpointResult && verifyEndpointResult.json) {
        const resultJson = await verifyEndpointResult.json()
        return { error: resultJson.error, message: resultJson.message }
      } else if (verifyEndpointResult && verifyEndpointResult.text) {
        const resultText = await verifyEndpointResult.text()
        return { error: resultText }
      } else {
        return { error: verifyEndpointResult.status }
      }
    } catch (error: unknown) {
      return { error }
    }
  }, [email, serverURL, token])

  useEffect(() => {
    async function verify() {
      const { error, message } = await callVerify()
      console.log(`Unknown error: (${error})`)
      setResult(message || `An error occured. Please try again. (${error})`)
      setIsError(error && !message)
      // console.info('callVerify not okay', { error, message })
    }
    if (!subscriber) {
      void verify()
    }
  }, [callVerify, serverURL, email, handleMagicLinkVerified, refreshSubscriber, subscriber, token])

  const handleRequestAnother = () => {
    const doAsync = async () => {
      const emailResult = await fetch('/api/emailToken', {
        body: JSON.stringify({
          email,
          verifyData,
        }),
        method: 'POST',
      })
      if (emailResult.ok) {
        const resultJson = await emailResult.json()
        setResult('An email has been sent containing your magic link.')
        setIsError(false)
        if (handleMagicLinkRequested) {
          handleMagicLinkRequested(resultJson)
        }
      } else {
        // const resultText = await emailResult.text()
        setResult('An error occured. Please try again.')
        setIsError(true)
      }
    }
    void doAsync()
  }

  return (
    <>
      {(!email || !token) && <RequestMagicLink classNames={classNames} />}
      {email &&
        token &&
        render({
          children,
          handleRequestAnother,
          isError,
          isLoading: !result,
          result: result || '',
        })}
    </>
  )
}
