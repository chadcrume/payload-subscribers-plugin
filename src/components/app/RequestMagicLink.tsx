'use client'

import type { Config } from '@payload-types'
import type { RequestMagicLinkResponse } from 'src/endpoints/requestMagicLink.js'

import { useSubscriber } from '@contexts/SubscriberProvider.js'
import { PayloadSDK } from '@payloadcms/sdk'
import { useServerUrl } from '@react-hooks/useServerUrl.js'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import styles from './shared.module.css'

export { RequestMagicLinkResponse }

interface IRequestMagicLink {
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  props?: any
  showResult?: boolean
}

type statusValues = 'default' | 'error' | 'sent'

export const RequestMagicLink = ({
  handleMagicLinkRequested,
  showResult = true,
}: IRequestMagicLink) => {
  const { subscriber } = useSubscriber()
  const { serverURL } = useServerUrl()

  const [status, setStatus] = useState<statusValues>('default')

  const sdk = new PayloadSDK<Config>({
    baseURL: serverURL || '',
  })

  const [result, setResult] = useState<string>()
  const [email, setEmail] = useState(subscriber?.email || '')

  useEffect(() => {
    setEmail(subscriber?.email || '')
  }, [subscriber])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const forwardUrl = window.location.pathname + '?now=' + new Date().toISOString()
    const emailTokenResponse = await sdk.request({
      json: {
        email,
        forwardUrl,
      },
      method: 'POST',
      path: '/api/emailToken',
    })
    if (emailTokenResponse.ok) {
      const emailTokenResponseJson: RequestMagicLinkResponse = await emailTokenResponse.json()
      if (handleMagicLinkRequested) {
        handleMagicLinkRequested(emailTokenResponseJson)
      }
      // @ts-expect-error One or the other exists
      const { emailResult, error } = emailTokenResponseJson
      if (error) {
        setStatus('error')
        setResult(`An error occured. Please try again. \n ${error}`)
      } else if (emailResult) {
        setStatus('sent')
        setResult('An email has been sent containing your magic link.')
      } else {
        setStatus('error')
        setResult(`An error occured. Please try again. \nResult unknown`)
      }
    } else {
      const emailTokenResponseText = await emailTokenResponse.text()
      setStatus('error')
      setResult(`An error occured. Please try again. \n${emailTokenResponseText}`)
    }
  }

  return (
    <div className={styles.wrapper}>
      {status == 'error' ? (
        <div className={styles.error}>{result}</div>
      ) : result && showResult ? (
        <div>{result}</div>
      ) : (
        <></>
      )}
      <div>
        <form method="POST" onSubmit={handleSubmit}>
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
    </div>
  )
}
