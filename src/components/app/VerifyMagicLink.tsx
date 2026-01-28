'use client'

import type { Config } from '@payload-types'
import type { RequestMagicLinkResponse } from 'src/endpoints/requestMagicLink.js'
import type { VerifyMagicLinkResponse } from 'src/endpoints/verifyMagicLink.js'

import { PayloadSDK } from '@payloadcms/sdk'
import { useSearchParams } from 'next/navigation.js'
import { useCallback, useEffect, useState } from 'react'

export { VerifyMagicLinkResponse }
import { useServerUrl } from '@react-hooks/useServerUrl.js'
import { useSubscriber } from 'payload-subscribers-plugin/ui'

import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

export interface IVerifyMagicLink {
  classNames?: VerifyMagicLinkClasses
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleMagicLinkVerified?: (result: VerifyMagicLinkResponse) => void
  renderButton?: (props: {
    forwardUrl?: string
    name?: string
    onClick?: () => any
    text?: string
  }) => React.ReactNode
  showResultBeforeForwarding: boolean
}

export type VerifyMagicLinkClasses = {
  button?: string
  container?: string
  error?: string
  form?: string
  loading?: string
  message?: string
}

export const VerifyMagicLink = ({
  classNames = {
    button: '',
    container: '',
    error: '',
    form: '',
    loading: '',
    message: '',
  },
  handleMagicLinkRequested,
  handleMagicLinkVerified,
  renderButton = ({ name, forwardUrl, onClick, text }) =>
    forwardUrl ? (
      <a href={forwardUrl}>
        <button
          className={mergeClassNames([styles.button, classNames.button])}
          name={name}
          type="button"
        >
          {text}
        </button>
      </a>
    ) : (
      <button
        className={mergeClassNames([styles.button, classNames.button])}
        name={name}
        onClick={onClick}
        type="button"
      >
        {text}
      </button>
    ),
  showResultBeforeForwarding = true,
}: IVerifyMagicLink) => {
  const { serverURL } = useServerUrl()
  const {
    // refreshSubscriber,
    subscriber,
  } = useSubscriber()

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const forwardUrl = searchParams.get('forwardUrl')
  const token = searchParams.get('token')

  const [result, setResult] = useState<string>()
  const [isError, setIsError] = useState<boolean>(false)
  // const [email, setEmail] = useState('')

  const { refreshSubscriber } = useSubscriber()

  const callVerify = useCallback(async () => {
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

    return verifyResult
  }, [email, serverURL, token])

  useEffect(() => {
    async function verify() {
      const verifyResult = await callVerify()
      if (verifyResult.ok) {
        const resultJson = await verifyResult.json()
        setResult(resultJson.message || resultJson.error)
        setIsError(resultJson.error && !resultJson.message)

        // // This is causing out of control rendering. Not totally sure why, or of another way to do it.
        // refreshSubscriber()

        // // This is also causing out of control rendering. Not totally sure why, or of another way to do it.
        // if (handleMagicLinkVerified) {
        //   handleMagicLinkVerified(resultJson)
        // }
      } else {
        // const resultText = await verifyResult.text()
        setResult('An error occured. Please try again')
        setIsError(true)
      }
    }
    if (!subscriber) {
      void verify()
    }
  }, [callVerify, serverURL, email, handleMagicLinkVerified, refreshSubscriber, subscriber, token])

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
    <div className={mergeClassNames([styles.container, classNames.container])}>
      {!result && (
        <p className={mergeClassNames([styles.loading, classNames.loading])}>verifying...</p>
      )}
      {result && showResultBeforeForwarding && (
        <p
          className={mergeClassNames([
            styles.message,
            classNames.message,
            isError ? [styles.error, classNames.error] : [],
          ])}
        >
          {result}
        </p>
      )}
      <div className={mergeClassNames([styles.form, classNames.form])}>
        {result &&
          isError &&
          renderButton({
            name: 'request',
            onClick: handleRequestMagicLink,
            text: 'Request another magic link',
          })}
        {result &&
          forwardUrl &&
          renderButton({
            name: 'continue',
            forwardUrl,
            text: 'Continue',
          })}
      </div>
    </div>
  )
}
