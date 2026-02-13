'use client'

import { PayloadSDK } from '@payloadcms/sdk'
import { type ChangeEvent, useEffect, useState } from 'react'

import type { Config, OptInChannel, Subscriber } from '../../copied/payload-types.js'
import type { SubscribeResponse } from '../../endpoints/subscribe.js'

export { SubscribeResponse }

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import { useServerUrl } from '../../react-hooks/useServerUrl.js'
import { mergeClassNames } from './helpers.js'
import { SelectOptInChannels } from './SelectOptInChannels.js'
import styles from './shared.module.css'

/** Props for the Subscribe component. */
export interface ISubscribe {
  classNames?: SubscribeClasses
  handleSubscribe?: (result: SubscribeResponse) => void
  props?: any
  render?: (props: ISubscribeRenderProps) => React.ReactNode
  verifyUrl?: string | URL
}

/** Optional CSS class overrides for Subscribe elements. */
export type SubscribeClasses = {
  button?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  loading?: string
  message?: string
  section?: string
}

/** Interface for the Unsubscribe's render function prop. */
export interface ISubscribeRenderProps {
  email: string
  handleOptInChannelsSelected: (result: OptInChannel[]) => void
  handleSubscriptionsUpdate: () => Promise<void>
  selectedChannelIDs: string[]
  setEmail: (value: string) => void
  subscriber: null | Subscriber
}

type statusValues = 'default' | 'error' | 'sent' | 'updated'

/**
 * Subscribe/preferences form for authenticated subscribers. Shows SelectOptInChannels and an email
 * input when not yet authenticated. Submits to POST /api/subscribe to update opt-ins or trigger
 * verification email. Calls refreshSubscriber and handleSubscribe on success.
 *
 * @param props - See ISubscribe
 * @param props.render - (optional) A function to override the default component rendering
 * @returns Form with channel checkboxes, optional email field, "Save choices" button, and status message
 */
export const Subscribe = ({
  classNames = {
    button: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    loading: '',
    message: '',
    section: '',
  },
  handleSubscribe,
  render,
  verifyUrl,
}: ISubscribe) => {
  // Set up a default render function, used if there's not one in the props,
  // taking advantage of scope to access styles and classNames
  const defaultRender = ({
    email,
    handleOptInChannelsSelected,
    handleSubscriptionsUpdate,
    selectedChannelIDs,
    setEmail,
    subscriber,
  }: ISubscribeRenderProps): React.ReactNode => (
    <div
      className={mergeClassNames([
        'subscribers-subscribe subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      <h2>Subscribe</h2>
      <div className={mergeClassNames(['subscribers-section', styles.section, classNames.section])}>
        {subscriber?.status == 'unsubscribed' && <p>You are unsubscribed</p>}
        <SelectOptInChannels
          handleOptInChannelsSelected={handleOptInChannelsSelected}
          selectedOptInChannelIDs={selectedChannelIDs}
        />
      </div>
      <form
        className={mergeClassNames(['subscribers-form', styles.form, classNames.form])}
        method="POST"
        onSubmit={async (e) => {
          e.preventDefault()
          await handleSubscriptionsUpdate()
        }}
      >
        <div
          className={mergeClassNames(['subscribers-section', styles.section, classNames.section])}
        >
          {!subscriber && (
            <input
              aria-label="enter your email"
              className={mergeClassNames([
                'subscribers-emailInput',
                styles.emailInput,
                classNames.emailInput,
              ])}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="enter your email"
              type="email"
              value={email}
            />
          )}
          <button
            className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
            type="submit"
          >
            {!subscriber && <>Subscribe</>}
            {subscriber && subscriber?.status != 'unsubscribed' && <>Save choices</>}
            {subscriber?.status == 'unsubscribed' && <>Subscribe and save choices</>}
          </button>
        </div>
      </form>
      {!!result && (
        <p
          className={mergeClassNames([
            'subscribers-message',
            styles.message,
            classNames.message,
            status == 'error' ? ['subscribers-error', styles.error, classNames.error] : [],
          ])}
        >
          {result}
        </p>
      )}
    </div>
  )

  if (!render) {
    render = defaultRender
  }

  // Get a URL object from the verifyUrl option
  function isAbsolute(url: string): boolean {
    // Checks if it starts with "//" or contains "://" after the first character
    return url.indexOf('://') > 0 || url.indexOf('//') === 0
  }
  verifyUrl = !verifyUrl
    ? undefined
    : typeof verifyUrl == 'string' && isAbsolute(verifyUrl)
      ? new URL(verifyUrl)
      : window.location
        ? new URL(verifyUrl, window.location.protocol + window.location.host)
        : undefined

  const { refreshSubscriber, subscriber } = useSubscriber()

  const { serverURL } = useServerUrl()

  const sdk = new PayloadSDK<Config>({
    baseURL: serverURL || '',
  })

  const flattenChannels = (channels: (OptInChannel | string)[] | null | undefined) => {
    if (!channels) {
      return []
    }
    return channels.map((channel: OptInChannel | string) =>
      typeof channel == 'string' ? channel : channel.id,
    )
  }

  const [status, setStatus] = useState<statusValues>('default')
  const [result, setResult] = useState<string>()
  const [email, setEmail] = useState(subscriber ? subscriber.email : '')
  const [selectedChannelIDs, setSelectedChannelIDs] = useState<string[]>(() =>
    flattenChannels(subscriber?.optIns),
  )

  useEffect(() => {
    setEmail(subscriber?.email || '')
    setSelectedChannelIDs(flattenChannels(subscriber?.optIns))
  }, [subscriber])

  const handleOptInChannelsSelected = (result: OptInChannel[]) => {
    setSelectedChannelIDs(result.map((channel) => channel.id))
  }

  const handleSubscriptionsUpdate = async () => {
    const subscribeResult = await sdk.request({
      json: {
        email,
        optIns: selectedChannelIDs,
        verifyUrl: verifyUrl?.href,
      },
      method: 'POST',
      path: '/api/subscribe',
    })
    if (subscribeResult.ok) {
      const resultJson: SubscribeResponse = await subscribeResult.json()
      // // When subscriber optIns are updated...
      // | {
      //     email: string
      //     now: string
      //     optIns: string[]
      //   }
      // // When a verify link is emailed...
      // | {
      //     emailResult: any
      //     now: string
      //   }
      // // When any error occurs...
      // | {
      //     error: string
      //     now: string
      //   }
      // @ts-expect-error Silly type confusion
      const { emailResult, error } = resultJson
      if (error) {
        setStatus('error')
        setResult(`An error occured. Please try again. \n ${error}`)
      } else if (emailResult) {
        setStatus('sent')
        setResult('An email has been sent containing your magic link.')
      } else if (email) {
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

  return render({
    email,
    handleOptInChannelsSelected,
    handleSubscriptionsUpdate,
    selectedChannelIDs,
    setEmail,
    subscriber,
  })
}
