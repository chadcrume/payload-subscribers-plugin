'use client'

import { PayloadSDK } from '@payloadcms/sdk'
import { useSearchParams } from 'next/navigation.js'
import { useCallback, useEffect, useState } from 'react'

import type { RequestMagicLinkResponse } from '../..//endpoints/requestMagicLink.js'
import type { Config } from '../../copied/payload-types.js'
import type { VerifyMagicLinkResponse } from '../../endpoints/verifyMagicLink.js'

export { VerifyMagicLinkResponse }
import { RequestMagicLink, useSubscriber } from '../../exports/ui.js'
import { useServerUrl } from '../../react-hooks/useServerUrl.js'
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
    if (!email || !token) {
      console.info('Invalid input')
      return { error: 'Invalid input' }
    }
    try {
      // I tried using PayloadSDK.request, but when the endpoint
      // returns a not-okay status, PayloadSDK.request returns its
      // own "Bad request" error, and doesn't share the endpoint
      // result data.
      const verifyEndpointResult = await fetch(serverURL + '/api/verifyToken', {
        body: JSON.stringify({
          email,
          token,
        }),
        method: 'POST',
      })

      // return verifyEndpointResult
      if (verifyEndpointResult && verifyEndpointResult.json) {
        console.log(1)
        const resultJson = await verifyEndpointResult.json()
        return { error: resultJson.error, message: resultJson.message }
      } else if (verifyEndpointResult && verifyEndpointResult.text) {
        console.log(2)
        const resultText = await verifyEndpointResult.text()
        return { error: resultText }
      } else {
        console.log(3)
        return { error: verifyEndpointResult.status }
      }
    } catch (error: unknown) {
      console.log('catch')
      return { error }
    }
  }, [email, serverURL, token])

  useEffect(() => {
    async function verify() {
      const { error, message } = await callVerify()
      setResult(message || `An error occured. Please try again. (${error})`)
      setIsError(error && !message)
      // console.info('callVerify not okay', { error, message })
    }
    if (!subscriber) {
      void verify()
    }
  }, [callVerify, serverURL, email, handleMagicLinkVerified, refreshSubscriber, subscriber, token])

  const handleRequestAnother = async () => {
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
    <>
      {(!email || !token) && <RequestMagicLink classNames={classNames} />}
      {email && token && (
        <div className={mergeClassNames([styles.container, classNames.container])}>
          {!result && (
            <p className={mergeClassNames([styles.loading, classNames.loading])}>verifying...</p>
          )}
          {result && (
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
                onClick: handleRequestAnother,
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
      )}
    </>
  )
}
