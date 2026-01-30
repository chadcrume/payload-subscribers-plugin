'use client'

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
}: {
  classNames?: RequestOrSubscribeClasses
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleSubscribe?: (result: SubscribeResponse) => void
}) {
  const { subscriber } = useSubscriber()

  // Example: Conditionally render something or pass the state to children
  return (
    <>
      {subscriber ? (
        <Subscribe classNames={classNames} handleSubscribe={handleSubscribe} />
      ) : (
        <RequestMagicLink
          classNames={classNames}
          handleMagicLinkRequested={handleMagicLinkRequested}
        />
      )}
      {/* <div>subscriber = {JSON.stringify(subscriber)}</div> */}
    </>
  )
}
