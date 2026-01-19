'use client'

import type { Config } from '@payload-types'

import { useSearchParams } from 'next/navigation.js'
import { type ChangeEvent, useEffect, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'
// import type {RequestMagicLinkResponse} from

import type { RequestMagicLinkResponse } from 'src/endpoints/requestMagicLink.js'
import type { VerifyMagicLinkResponse } from 'src/endpoints/verifyMagicLink.js'

import styles from './VerifyMagicLink.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface IVerifyMagicLink {
  baseURL?: string
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleMagicLinkVerified?: (result: VerifyMagicLinkResponse) => void
  props?: any
  showResultBeforeForwarding: boolean
}

export const VerifyMagicLink = ({
  baseURL,
  handleMagicLinkRequested,
  handleMagicLinkVerified,
  showResultBeforeForwarding = false,
}: IVerifyMagicLink) => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [result, setResult] = useState<unknown>()
  // const [email, setEmail] = useState('')

  useEffect(() => {
    async function verify() {
      const sdk = new PayloadSDK<Config>({
        baseURL: baseURL || '',
      })

      const result = await sdk.request({
        json: {
          email,
          token,
        },
        method: 'POST',
        path: '/api/verifyToken',
      })
      if (result.ok) {
        const resultJson = await result.json()
        setResult('GOOD: ' + JSON.stringify(resultJson))
        if (handleMagicLinkVerified) {
          handleMagicLinkVerified(resultJson)
        }
      } else {
        const resultText = await result.text()
        setResult('BAD: ' + resultText)
      }
    }
    void verify()
  }, [baseURL, email, handleMagicLinkVerified, token])

  return (
    <>
      {!baseURL ? (
        <></>
      ) : result && showResultBeforeForwarding ? (
        <div className={styles.wrapper}>
          <div>{JSON.stringify(result)}</div>
        </div>
      ) : (
        <div className={styles.wrapper}>
          <div>verifying...</div>
        </div>
      )}
      <form
        method="POST"
        onSubmit={async (e) => {
          e.preventDefault()

          const sdk = new PayloadSDK<Config>({
            baseURL: baseURL || '',
          })

          const result = await sdk.request({
            json: {
              email,
            },
            method: 'POST',
            path: '/api/emailToken',
          })
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
        <button type="submit">Request another magic link</button>
      </form>
    </>
  )
}
