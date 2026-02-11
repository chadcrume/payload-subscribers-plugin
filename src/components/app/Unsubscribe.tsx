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
  renderButton?: (props: { name?: string; onClick?: () => any; text?: string }) => React.ReactNode
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

/**
 * Handles the verify step of magic-link flow. When URL has email and hash query params, calls
 * POST /api/unsubscribe to complete the unsubscribe. Displays children provided after unsubscribe is attempted.
 *
 * @param props - See IUnsubscribe
 * @returns Result message, and optional button/children
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
  renderButton = ({ name, onClick, text }) => (
    <button
      className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
      name={name}
      onClick={onClick}
      type="button"
    >
      {text}
    </button>
  ),
}: IUnsubscribe) => {
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
  }, [email, serverURL, hash])

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

  return (
    <div
      className={mergeClassNames([
        'subscribers-verify subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      {!result && (
        <p className={mergeClassNames(['subscribers-loading', styles.loading, classNames.loading])}>
          unsubscribing...
        </p>
      )}
      {result && (
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
        {result && children}
      </div>
    </div>
  )
}
