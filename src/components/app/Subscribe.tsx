'use client'

import type { Config, OptInChannel } from '@payload-types'

import { type ChangeEvent, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'
// import type {SubscribeResponse} from

import type { SubscribeResponse } from 'src/endpoints/subscribe.js'

import { SelectOptInChannels } from './SelectOptInChannels.js'
import styles from './Subscribe.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface ISubscribe {
  baseURL?: string
  handleMagicLinkRequested?: (result: SubscribeResponse) => void
  props?: any
  showResult: boolean
}

export const Subscribe = ({
  baseURL,
  handleMagicLinkRequested,
  showResult = false,
}: ISubscribe) => {
  const sdk = new PayloadSDK<Config>({
    baseURL: baseURL || '',
  })

  const [result, setResult] = useState<unknown>()
  const [email, setEmail] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<OptInChannel[]>([])

  const handleOptInChannelsSelected = (result: OptInChannel[]) => {
    setSelectedChannels(result)
  }

  return !baseURL ? (
    <></>
  ) : (
    <>
      {!!result && !!showResult && (
        <div className={styles.wrapper}>
          <div>{JSON.stringify(result)}</div>
        </div>
      )}
      <div className={styles.wrapper}>
        <SelectOptInChannels
          baseURL={baseURL}
          handleOptInChannelsSelected={handleOptInChannelsSelected}
          selectedOptInChannels={selectedChannels}
        />
        <form
          method="POST"
          onSubmit={async (e) => {
            e.preventDefault()
            const result = await sdk.request({
              json: {
                email,
              },
              method: 'POST',
              path: '/api/subscribe',
            })
            if (result.ok) {
              const resultJson = await result.json()
              setResult(JSON.stringify(resultJson))
              if (handleMagicLinkRequested) {
                handleMagicLinkRequested(resultJson)
              }
            } else {
              const resultText = await result.text()
              setResult(resultText)
            }
          }}
        >
          <input
            aria-label="enter your email"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="enter your email"
            type="email"
            value={email}
          />
          <button type="submit">Subscribe</button>
        </form>
      </div>{' '}
    </>
  )
}
