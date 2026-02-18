'use client'

import { useEffect, useState } from 'react'

import type { OptInChannel, Subscriber } from '../copied/payload-types.js'
import type { SubscribeResponse } from '../endpoints/subscribe.js'

export { SubscribeResponse }

import type { GetOptInChannelsResponse } from '../endpoints/getOptInChannels.js'

import { useSubscriber } from '../contexts/SubscriberProvider.js'
import { useServerUrl } from '../react-hooks/useServerUrl.js'

/**
 * Options for the useSubscribe hook.
 *
 * @property handleSubscribe - Callback when subscription is updated or magic link is sent
 * @property verifyData - Optional data sent with subscribe requests (e.g. for verification)
 */
export interface IUseSubscribeOptions {
  handleSubscribe?: (result: SubscribeResponse) => void
  verifyData?: string
}

/**
 * Return value of useSubscribe.
 *
 * @property result - Success or error message from the last update
 * @property status - Current status: 'default' | 'updating' | 'updated' | 'sent' | 'error'
 * @property subscriber - Current subscriber from context, or null
 * @property updateSubscriptions - Updates opt-in channels for the current subscriber
 */
export interface IUseSubscribe {
  optInChannels: OptInChannel[]
  result?: string
  status?: UpdateSubscriptionStatusValue
  subscriber: ({ optIns?: null | OptInChannel[] } & Omit<Subscriber, 'optIns'>) | null
  updateSubscriptions: (selectedChannelIDs: string[]) => Promise<void>
}

export type UpdateSubscriptionStatusValue = 'default' | 'error' | 'sent' | 'updated' | 'updating'

/**
 * Hook to update subscriber opt-in channels. Calls POST /api/subscribe, refreshes subscriber
 * from context on success, and optionally invokes handleSubscribe.
 *
 * @param options - Hook options (see IUseSubscribeOptions)
 * @param options.handleSubscribe - Callback when subscription is updated or magic link is sent
 * @param options.verifyData - Optional data sent with subscribe requests (e.g. for verification)
 * @returns updateSubscriptions, subscriber, result message, and status (see IUseSubscribe)
 */
export const useSubscribe = ({
  handleSubscribe,
  verifyData,
}: IUseSubscribeOptions): IUseSubscribe => {
  const { refreshSubscriber, subscriber } = useSubscriber()

  const { serverURL } = useServerUrl()
  const [optInChannels, setOptInChannels] = useState<OptInChannel[]>([])

  useEffect(() => {
    async function getOptInChannels() {
      const result = await fetch(`${serverURL ? serverURL : ''}/api/optinchannels`, {
        method: 'GET',
      })
      if (result.ok) {
        const resultJson: GetOptInChannelsResponse = await result.json()
        // @ts-expect-error OR type union not recognized
        setOptInChannels(resultJson?.optInChannels)
      } else {
        const resultText = await result.text()
        console.log('Error getting opt-in channels: ', [{ resultText }])
      }
    }
    void getOptInChannels()
  }, [serverURL])

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
    optInChannels,
    result,
    status,
    subscriber,
    updateSubscriptions,
  }
}
