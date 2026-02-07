'use client'

import { useEffect, useState } from 'react'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import {
  RequestMagicLink,
  type RequestMagicLinkResponse,
  Subscribe,
  type SubscribeResponse,
} from '../../exports/ui.js'

export type { RequestMagicLinkResponse, SubscribeResponse }

/** Optional CSS class overrides for RequestOrSubscribe and its child components. */
export type RequestOrSubscribeClasses = {
  button?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  loading?: string
  message?: string
  section?: string
}

/**
 * Composite component that shows Subscribe when a subscriber is authenticated, otherwise
 * RequestMagicLink. Used as a single entry point for "sign in or manage subscriptions."
 *
 * @param props.classNames - Optional class overrides passed to child components
 * @param props.handleMagicLinkRequested - Callback when a magic link is requested (no subscriber yet)
 * @param props.handleSubscribe - Callback when subscription/opt-ins are updated (subscriber present)
 * @param props.verifyUrl - Base URL for verify links in emails
 * @returns Either Subscribe or RequestMagicLink based on subscriber context
 */
export function RequestOrSubscribe({
  classNames = {
    button: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    loading: '',
    message: '',
    section: '',
  },
  handleMagicLinkRequested,
  handleSubscribe,
  verifyUrl,
}: {
  classNames?: RequestOrSubscribeClasses
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleSubscribe?: (result: SubscribeResponse) => void
  verifyUrl?: URL
}) {
  const { subscriber } = useSubscriber()

  // Example: Conditionally render something or pass the state to children
  return (
    <>
      {subscriber ? (
        <Subscribe
          classNames={classNames}
          handleSubscribe={handleSubscribe}
          verifyUrl={verifyUrl}
        />
      ) : (
        <RequestMagicLink
          classNames={classNames}
          handleMagicLinkRequested={handleMagicLinkRequested}
          verifyUrl={verifyUrl}
        />
      )}
      {/* <div>subscriber = {JSON.stringify(subscriber)}</div> */}
    </>
  )
}
