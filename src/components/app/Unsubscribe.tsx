'use client'

import { useSearchParams } from 'next/navigation.js'
import { useEffect } from 'react'

import type { UnsubscribeResponse } from '../../endpoints/unsubscribe.js'

export { UnsubscribeResponse }
import { useSubscriber } from '../../exports/ui.js'
import { useUnsubscribe } from '../../hooks/useUnsubscribe.js'
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
 * Handles the unsubscribe action, to be used with unsubscribe URLs in emails, etc.
 * Uses the URL params for email and hash to call /api/unsubscribe to complete the unsubscribe.
 * Allows
 * Displays children provided after unsubscribe is attempted.
 *
 * @param props - See IUnsubscribe
 * @param props.children - (optional) Child ReactNodes to be rendered after unsubscribe attempted, successfully or with error
 * @param props.classNames - (optional) Optional additions to the structured CSS elements
 * @param props.handleUnsubscribe - (optional) An event handler called after unsubscribe is attempted
 * @returns Shows loading status, error status, result message, and component children
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
}: IUnsubscribe) => {
  const { isError, isLoading, result, unsubscribe } = useUnsubscribe({ handleUnsubscribe })

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const hash = searchParams.get('hash')

  useEffect(() => {
    async function callUnsubscribe() {
      if (email && hash) {
        await unsubscribe({ email, hash })
      }
    }
    void callUnsubscribe()
  }, [email, hash, unsubscribe])

  return (
    <div
      className={mergeClassNames([
        'subscribers-callUnsubscribe subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      {isLoading && (
        <p className={mergeClassNames(['subscribers-loading', styles.loading, classNames.loading])}>
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
