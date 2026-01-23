'use client'

import type { Config, OptInChannel } from '@payload-types'

import { type ChangeEvent, useEffect, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'

import type { SubscribeResponse } from '@endpoints/subscribe.js'
export { SubscribeResponse }

import { useSubscriber } from '@contexts/SubscriberProvider.js'

import { SelectOptInChannels } from './SelectOptInChannels.js'
import styles from './Subscribe.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface ISubscribe {
  baseURL?: string
  handleSubscribe?: (result: SubscribeResponse) => void
  props?: any
  showResult: boolean
}

export const Subscribe = ({ baseURL, handleSubscribe, showResult = false }: ISubscribe) => {
  const sdk = new PayloadSDK<Config>({
    baseURL: baseURL || '',
  })
  const { refreshSubscriber, subscriber } = useSubscriber()

  const [result, setResult] = useState<unknown>()
  const [email, setEmail] = useState(subscriber ? subscriber.email : '')
  // @ts-expect-error This is correct, just not sure how to deal with Payload internal generic Post typing
  const [selectedChannelIDs, setSelectedChannelIDs] = useState<string[]>(subscriber?.optIns || [])

  useEffect(() => {
    setEmail(subscriber?.email || '')
    // @ts-expect-error This is correct, just not sure how to deal with Payload internal generic Post typing
    setSelectedChannelIDs(subscriber?.optIns || [])
  }, [subscriber])

  const handleOptInChannelsSelected = (result: OptInChannel[]) => {
    setSelectedChannelIDs(result.map((channel) => channel.id))
  }

  const handleSubmit = async () => {
    const result = await sdk.request({
      json: {
        email,
        optIns: selectedChannelIDs,
      },
      method: 'POST',
      path: '/api/subscribe',
    })
    if (result.ok) {
      const resultJson: SubscribeResponse = await result.json()
      setResult(JSON.stringify(resultJson))
      refreshSubscriber()
      if (handleSubscribe) {
        handleSubscribe(resultJson)
      }
    } else {
      const resultText = await result.text()
      setResult(resultText)
    }
  }

  return !baseURL ? (
    <></>
  ) : (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <SelectOptInChannels
          baseURL={baseURL}
          handleOptInChannelsSelected={handleOptInChannelsSelected}
          selectedOptInChannelIDs={selectedChannelIDs}
        />
      </div>
      <form
        method="POST"
        onSubmit={async (e) => {
          e.preventDefault()
          await handleSubmit()
        }}
      >
        <div className={styles.section}>
          {!subscriber && (
            <input
              aria-label="enter your email"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="enter your email"
              type="email"
              value={email}
            />
          )}
          <button type="submit">Save choices</button>
        </div>
      </form>
      {!!subscriber && (
        <div className={styles.section}>
          <div>subscriber:</div>
          <pre>{JSON.stringify(subscriber, null, 2)}</pre>
        </div>
      )}
      {!!result && !!showResult && (
        <div className={styles.section}>
          <div>{JSON.stringify(result)}</div>
        </div>
      )}
    </div>
  )
}
