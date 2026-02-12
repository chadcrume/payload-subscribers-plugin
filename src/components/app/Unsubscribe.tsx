'use client'

import { useSearchParams } from 'next/navigation.js'
import { useCallback, useEffect, useState } from 'react'

import type { UnsubscribeResponse } from '../../endpoints/unsubscribe.js'

export { UnsubscribeResponse }
import { useSubscriber } from '../../exports/ui.js'
import { useServerUrl } from '../../react-hooks/useServerUrl.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

/** Props for the Unsubscribe component. */
export interface IUnsubscribe {
  children?: React.ReactNode
  classNames?: UnsubscribeClasses
  handleUnsubscribe?: (result: UnsubscribeResponse) => void
  render?: (props: IUnsubscribeRenderProps) => React.ReactNode
}

/** Optional CSS class overrides for Unsubscribe elements. */
export type UnsubscribeClasses = {
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
  isError: boolean
  isLoading: boolean
  result: string
}

/**
 * Handles the unsubscribe action, to be used with unsubscribe URLs in emails, etc.
 * Uses the URL params for email and hash to call /api/unsubscribe to complete the unsubscribe.
 * Allows
 * Displays children provided after unsubscribe is attempted.
 *
 * @param props - See IUnsubscribe
 * @param props.children - (optional) Child ReadNodes to be rendered in the render function
 * @param props.classNames - (optional) Optional additions to the structured CSS elements
 * @param props.handleUnsubscribe - (optional) An event handler called after unsubscribe is attempted
 * @param props.render - (optional) A function to override the default component rendering
 * @returns The results of the **render** prop function — or a default layout — including loading status,
 *          error status, result message, and component children
 */
export const Unsubscribe = ({
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
  handleUnsubscribe,
  render,
}: IUnsubscribe) => {
  //
  // Set up a default render function, used if there's not one in the props,
  // taking advantage of scope to access styles and classNames
  const defaultRender = ({
    children,
    isError = false,
    isLoading = true,
    result = '',
  }: IUnsubscribeRenderProps): React.ReactNode => {
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
            unsubscribing...
          </p>
        )}
        {!isLoading && (
          <>
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
            <div className={mergeClassNames(['subscribers-form', styles.form, classNames.form])}>
              {children}
            </div>
          </>
        )}
      </div>
    )
  }

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
  const hash = searchParams.get('hash')

  const [result, setResult] = useState<string>()
  const [isError, setIsError] = useState<boolean>(false)
  // const [email, setEmail] = useState('')

  const { refreshSubscriber } = useSubscriber()

  const callUnsubscribe = useCallback(async () => {
    if (!email || !hash) {
      return { error: 'Invalid input' }
    }
    let resultJson
    try {
      const unsubscribeEndpointResult = await fetch(
        `${serverURL ? serverURL : ''}/api/unsubscribe`,
        {
          body: JSON.stringify({
            email,
            unsubscribeToken: hash,
          }),
          method: 'POST',
        },
      )

      // return unsubscribeEndpointResult
      if (unsubscribeEndpointResult && unsubscribeEndpointResult.json) {
        resultJson = await unsubscribeEndpointResult.json()
        resultJson = { error: resultJson.error, message: resultJson.message, now: resultJson.now }
      } else if (unsubscribeEndpointResult && unsubscribeEndpointResult.text) {
        const resultText = await unsubscribeEndpointResult.text()
        resultJson = { error: resultText, now: new Date().toISOString() }
      } else {
        resultJson = { error: unsubscribeEndpointResult.status, now: new Date().toISOString() }
      }
    } catch (error: any) {
      resultJson = { error, now: new Date().toISOString() }
    }
    if (handleUnsubscribe) {
      handleUnsubscribe(resultJson)
    }
    return resultJson
  }, [email, serverURL, handleUnsubscribe, hash])

  useEffect(() => {
    async function verify() {
      const { error, message } = await callUnsubscribe()
      console.log(`Unknown error: (${error})`)
      setResult(message || `An error occured. Please try again. (${error})`)
      setIsError(error && !message)
      // console.info('callUnsubscribe not okay', { error, message })
    }
    if (!subscriber) {
      void verify()
    }
  }, [callUnsubscribe, serverURL, email, refreshSubscriber, subscriber, hash])

  return render({ children, isError, isLoading: !result, result: result || '' })
}
