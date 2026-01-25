'use client'

import {
  RequestMagicLink,
  type RequestMagicLinkResponse,
  Subscribe,
  type SubscribeResponse,
} from 'payload-subscribers-plugin/ui'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'

export type { RequestMagicLinkResponse, SubscribeResponse }

export function RequestOrSubscribe({
  handleMagicLinkRequested,
  handleSubscribe,
}: {
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleSubscribe?: (result: SubscribeResponse) => void
}) {
  const { subscriber } = useSubscriber()

  // Example: Conditionally render something or pass the state to children
  return (
    <>
      {subscriber ? (
        <Subscribe handleSubscribe={handleSubscribe} />
      ) : (
        <RequestMagicLink handleMagicLinkRequested={handleMagicLinkRequested} />
      )}
      {/* <div>subscriber = {JSON.stringify(subscriber)}</div> */}
    </>
  )
}
