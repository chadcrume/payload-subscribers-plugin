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

/**
 * Props for the Unsubscribe component.
 *
 * @property children - Optional React nodes rendered after unsubscribe is attempted
 * @property classNames - Optional CSS class overrides for the component elements
 * @property handleUnsubscribe - Callback when unsubscribe is attempted (success or error)
 */
export interface IUnsubscribe {
  children?: React.ReactNode
  classNames?: UnsubscribeClasses
  handleUnsubscribe?: (result: UnsubscribeResponse) => void
}

/**
 * Optional CSS class overrides for Unsubscribe elements.
 *
 * @property button - Class for buttons
 * @property container - Class for the main container
 * @property emailInput - Class for the email input field
 * @property error - Class for error messages
 * @property form - Class for the form
 * @property loading - Class for loading state
 * @property message - Class for result message text
 */
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
 * Handles the unsubscribe action, for use with unsubscribe URLs in emails, etc.
 * Uses URL params email and hash to call POST /api/unsubscribe. Displays children after attempt.
 *
 * @param props - Component props (see IUnsubscribe)
 * @param props.children - Optional React nodes rendered after unsubscribe is attempted
 * @param props.classNames - Optional class overrides for the component elements
 * @param props.handleUnsubscribe - Callback when unsubscribe is attempted (success or error)
 * @returns Loading status, result message, and children
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
