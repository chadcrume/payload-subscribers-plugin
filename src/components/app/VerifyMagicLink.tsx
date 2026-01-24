'use client'

import type { Config } from '@payload-types'

import { useSearchParams } from 'next/navigation.js'
import { useEffect, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
import { useConfig } from '@payloadcms/ui'
// import { getPayload } from 'payload'
// import type {RequestMagicLinkResponse} from

import type { RequestMagicLinkResponse } from 'src/endpoints/requestMagicLink.js'
import type { VerifyMagicLinkResponse } from 'src/endpoints/verifyMagicLink.js'
export { VerifyMagicLinkResponse }

import Link from 'next/link.js'

import styles from './VerifyMagicLink.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface IVerifyMagicLink {
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleMagicLinkVerified?: (result: VerifyMagicLinkResponse) => void
  props?: any
  showResultBeforeForwarding: boolean
}

export const VerifyMagicLink = ({
  handleMagicLinkRequested,
  handleMagicLinkVerified,
  showResultBeforeForwarding = true,
}: IVerifyMagicLink) => {
  const { config } = useConfig()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const forwardUrl = searchParams.get('forwardUrl')
  const token = searchParams.get('token')

  const [result, setResult] = useState<unknown>()
  // const [email, setEmail] = useState('')

  useEffect(() => {
    async function verify() {
      const sdk = new PayloadSDK<Config>({
        baseURL: config.serverURL || '',
      })

      const verifyResult = await sdk.request({
        json: {
          email,
          token,
        },
        method: 'POST',
        path: '/api/verifyToken',
      })
      if (verifyResult.ok) {
        const resultJson = await verifyResult.json()
        setResult('GOOD: ' + JSON.stringify(resultJson))
        if (handleMagicLinkVerified) {
          handleMagicLinkVerified(resultJson)
        }
      } else {
        const resultText = await verifyResult.text()
        setResult('BAD: ' + resultText)
      }
    }
    void verify()
  }, [config, email, handleMagicLinkVerified, token])

  const handleSubmit = async () => {
    const sdk = new PayloadSDK<Config>({
      baseURL: config.serverURL || '',
    })

    const emailResult = await sdk.request({
      json: {
        email,
      },
      method: 'POST',
      path: '/api/emailToken',
    })
    if (emailResult.ok) {
      const resultJson = await emailResult.json()
      setResult('GOOD: ' + JSON.stringify(resultJson))
      if (handleMagicLinkRequested) {
        handleMagicLinkRequested(resultJson)
      }
    } else {
      const resultText = await emailResult.text()
      setResult('BAD: ' + resultText)
    }
  }
  return (
    <div className={styles.wrapper}>
      {
        <>
          {result && showResultBeforeForwarding ? (
            <div>
              <div>{JSON.stringify(result)}</div>
              {forwardUrl && (
                <div>
                  <a href={forwardUrl}>Continue</a>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div>verifying...</div>
            </div>
          )}
          <form
            method="POST"
            onSubmit={async (e) => {
              e.preventDefault()
              await handleSubmit()
            }}
          >
            <button type="submit">Request another magic link</button>
          </form>
        </>
      }
    </div>
  )
}
