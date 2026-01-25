'use client'

import type { Config } from '@payload-types'

import { useSearchParams } from 'next/navigation.js'
import { useEffect, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'
// import type {RequestMagicLinkResponse} from

import type { RequestMagicLinkResponse } from 'src/endpoints/requestMagicLink.js'
import type { VerifyMagicLinkResponse } from 'src/endpoints/verifyMagicLink.js'
export { VerifyMagicLinkResponse }
import { useServerUrl } from '@react-hooks/useServerUrl.js'

import styles from './shared.module.css'

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
  const { serverURL } = useServerUrl()

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const forwardUrl = searchParams.get('forwardUrl')
  const token = searchParams.get('token')

  const [result, setResult] = useState<string>()
  const [isError, setIsError] = useState<boolean>(false)
  // const [email, setEmail] = useState('')

  useEffect(() => {
    async function verify() {
      const sdk = new PayloadSDK<Config>({
        baseURL: serverURL || '',
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
        setResult(resultJson.message || resultJson.error)
        setIsError(resultJson.error && !resultJson.message)
        if (handleMagicLinkVerified) {
          handleMagicLinkVerified(resultJson)
        }
      } else {
        // const resultText = await verifyResult.text()
        setResult('An error occured. Please try again')
        setIsError(true)
      }
    }
    void verify()
  }, [serverURL, email, handleMagicLinkVerified, token])

  const handleRequestMagicLink = async () => {
    const sdk = new PayloadSDK<Config>({
      baseURL: serverURL || '',
    })

    const emailResult = await sdk.request({
      json: {
        email,
        forwardUrl,
      },
      method: 'POST',
      path: '/api/emailToken',
    })
    if (emailResult.ok) {
      const resultJson = await emailResult.json()
      setResult('An email has been sent containing your magic link.')
      setIsError(false)
      if (handleMagicLinkRequested) {
        handleMagicLinkRequested(resultJson)
      }
    } else {
      // const resultText = await emailResult.text()
      setResult('An error occured. Please try again.')
      setIsError(true)
    }
  }
  return (
    <div className={styles.wrapper}>
      {result && showResultBeforeForwarding ? (
        <>
          <div className={isError ? styles.error : undefined}>
            <p>{result}</p>
          </div>
          {forwardUrl && (
            <div>
              <a href={forwardUrl}>
                <button type="button">Continue</button>
              </a>
            </div>
          )}
        </>
      ) : (
        <div>
          <p>verifying...</p>
        </div>
      )}
      <div>
        <button onClick={handleRequestMagicLink} type="submit">
          Request another magic link
        </button>
      </div>
    </div>
  )
}
