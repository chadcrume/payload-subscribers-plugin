'use client'

import { useState } from 'react'

import type { Subscriber } from '../copied/payload-types.js'
import type { SubscribeResponse } from '../endpoints/subscribe.js'

export { SubscribeResponse }

import { useSubscriber } from '../contexts/SubscriberProvider.js'

/** Options for the useSubscribe hook. */
export interface IUseSubscribeOptions {
  handleSubscribe?: (result: SubscribeResponse) => void
  verifyData?: string
}

/** Interface for useSubscribe props. */
export interface IUseSubscribe {
  result?: string
  status?: UpdateSubscriptionStatusValue
  subscriber: null | Subscriber
  updateSubscriptions: (selectedChannelIDs: string[]) => Promise<void>
}

export type UpdateSubscriptionStatusValue = 'default' | 'error' | 'sent' | 'updated' | 'updating'

/**
 * Subscribe/preferences form for authenticated subscribers. Shows SelectOptInChannels and an email
 * input when not yet authenticated. Submits to POST /api/subscribe to update opt-ins or trigger
 * verification email. Calls refreshSubscriber and handleSubscribe on success.
 *
 * @param props - See IUseSubscribeOptions
 * @param props.handleSubscribe - (optional) ...
 * @param props.verifyData - (optional) ...
 * @returns Form with channel checkboxes, optional email field, "Save choices" button, and status message
 */
export const useSubscribe = ({
  handleSubscribe,
  verifyData,
}: IUseSubscribeOptions): IUseSubscribe => {
  const { refreshSubscriber, subscriber } = useSubscriber()

  const [status, setStatus] = useState<UpdateSubscriptionStatusValue>('default')
  const [result, setResult] = useState<string>()

  const updateSubscriptions = async (selectedChannelIDs: string[]) => {
    setStatus('updating')
    setResult(`Updating...`)
    const subscribeResult = await fetch('/api/subscribe', {
      body: JSON.stringify({
        email: subscriber?.email,
        optIns: selectedChannelIDs,
        verifyData,
      }),
      method: 'POST',
    })
    if (subscribeResult.ok) {
      const resultJson: SubscribeResponse = await subscribeResult.json()
      // @ts-expect-error Silly type confusion
      const { emailResult, error } = resultJson
      if (error) {
        setStatus('error')
        setResult(`An error occured. Please try again. \n ${error}`)
      } else if (emailResult) {
        setStatus('sent')
        setResult('An email has been sent containing your magic link.')
      } else if (subscriber) {
        setStatus('updated')
        setResult(`You're subscriptions have been updated.`)
      } else {
        setStatus('error')
        setResult(`An error occured. Please try again. \nResult unknown`)
      }

      refreshSubscriber()

      if (handleSubscribe) {
        handleSubscribe(resultJson)
      }
    } else {
      // const resultText = await subscribeResult.text()
      setStatus('error')
      setResult(`An error occured. Please try again. \nResult unknown`)
    }
  }

  return {
    result,
    status,
    subscriber,
    updateSubscriptions,
  }
}
