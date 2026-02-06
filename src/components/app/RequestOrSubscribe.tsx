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
