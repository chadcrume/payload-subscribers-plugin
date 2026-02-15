'use client'

import { type ChangeEvent, useEffect, useState } from 'react'

import type { OptInChannel, Subscriber } from '../../copied/payload-types.js'
import type { SubscribeResponse } from '../../endpoints/subscribe.js'

export { SubscribeResponse }

import type { RequestMagicLinkStatusValue } from '../../hooks/useRequestMagicLink.js'
import type { UpdateSubscriptionStatusValue } from '../../hooks/useSubscribe.js'

import { useRequestMagicLink } from '../../hooks/useRequestMagicLink.js'
import { useSubscribe } from '../../hooks/useSubscribe.js'
import { useUnsubscribe } from '../../hooks/useUnsubscribe.js'
import { mergeClassNames } from './helpers.js'
import { SelectOptInChannels } from './SelectOptInChannels.js'
import styles from './shared.module.css'

/** Props for the Subscribe component. */
export interface ISubscribe {
  classNames?: SubscribeClasses
  handleSubscribe?: (result: SubscribeResponse) => void
  props?: any
  render?: (props: ISubscribeRenderProps) => React.ReactNode
  verifyData?: string
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
  result?: string
  selectedChannelIDs: string[]
  sendMagicLink: (email: string) => Promise<void>
  setEmail: (value: string) => void
  status?: RequestMagicLinkStatusValue | UpdateSubscriptionStatusValue
  subscriber: null | Subscriber
  updateSubscriptions: (selectedChannelIDs: string[]) => Promise<void>
}

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
  verifyData,
}: ISubscribe) => {
  const { unsubscribe } = useUnsubscribe({ handleUnsubscribe: () => {} })
  //
  // Set up a default render function, used if there's not one in the props,
  // taking advantage of scope to access styles and classNames
  const defaultRender = ({
    handleOptInChannelsSelected,
    result,
    selectedChannelIDs,
    sendMagicLink,
    status,
    subscriber,
    updateSubscriptions,
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
          if (subscriber) {
            await updateSubscriptions(selectedChannelIDs)
          } else {
            await sendMagicLink(email)
          }
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
          {subscriber && subscriber?.status != 'unsubscribed' && (
            <button
              className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
              onClick={async () => {
                await unsubscribe()
              }}
              type="button"
            >
              Unsubscribe from all
            </button>
          )}
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

  const [email, setEmail] = useState<string>('')

  const handleMagicLinkRequested = () => {}
  const {
    result: requestResult,
    sendMagicLink,
    status: requestStatus,
  } = useRequestMagicLink({
    handleMagicLinkRequested,
    verifyData,
  })
  const {
    result: subscribeResult,
    status: subscribeStatus,
    subscriber,
    updateSubscriptions,
  } = useSubscribe({
    handleSubscribe,
    verifyData,
  })

  const flattenChannels = (channels: (OptInChannel | string)[] | null | undefined) => {
    if (!channels) {
      return []
    }
    return channels.map((channel: OptInChannel | string) =>
      typeof channel == 'string' ? channel : channel.id,
    )
  }

  const [selectedChannelIDs, setSelectedChannelIDs] = useState<string[]>(() =>
    flattenChannels(subscriber?.optIns),
  )

  useEffect(() => {
    setSelectedChannelIDs(flattenChannels(subscriber?.optIns))
  }, [subscriber])

  const handleOptInChannelsSelected = (result: OptInChannel[]) => {
    setSelectedChannelIDs(result.map((channel) => channel.id))
  }

  return render({
    email,
    handleOptInChannelsSelected,
    result: requestResult || subscribeResult,
    selectedChannelIDs,
    sendMagicLink,
    setEmail,
    status: requestStatus || subscribeStatus,
    subscriber,
    updateSubscriptions,
  })
}
