'use client'

import type { Config } from '@payload-types'

import { type ChangeEvent, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'
// import type {requestMagicLinkResponse} from

import type { requestMagicLinkResponse } from 'src/endpoints/requestMagicLink.js'

import styles from './RequestMagicLink.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface IRequestMagicLink {
  baseURL?: string
  handleMagicLinkRequested?: (result: requestMagicLinkResponse) => void
  props?: any
  showResult: boolean
}

export const RequestMagicLink = ({
  baseURL,
  handleMagicLinkRequested,
  showResult = false,
}: IRequestMagicLink) => {
  const sdk = new PayloadSDK<Config>({
    baseURL: baseURL || '',
  })

  const [result, setResult] = useState<unknown>()
  const [email, setEmail] = useState('')
  return !baseURL ? (
    <></>
  ) : result && showResult ? (
    <div className={styles.wrapper}>
      <div>{JSON.stringify(result)}</div>
    </div>
  ) : (
    <div className={styles.wrapper}>
      <form
        method="POST"
        onSubmit={async (e) => {
          e.preventDefault()
          const result = await sdk.request({
            json: {
              email,
            },
            method: 'POST',
            path: '/api/emailToken',
          })
          // const result = await fetch('/api/emailToken', {
          //   body: JSON.stringify({ email }),
          //   method: 'POST',
          //   // path: '/api/emailToken',
          // })
          if (result.ok) {
            const resultJson = await result.json()
            setResult('GOOD: ' + JSON.stringify(resultJson))
            if (handleMagicLinkRequested) {
              handleMagicLinkRequested(resultJson)
            }
          } else {
            const resultText = await result.text()
            setResult('BAD: ' + resultText)
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
        <button type="submit">Request magic link</button>
      </form>
    </div>
  )
}
