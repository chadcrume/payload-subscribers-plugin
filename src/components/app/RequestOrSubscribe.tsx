'use client'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import {
  RequestMagicLink,
  type RequestMagicLinkResponse,
  Subscribe,
  type SubscribeResponse,
} from '../../exports/ui.js'

export type { RequestMagicLinkResponse, SubscribeResponse }

/**
 * Props for the RequestOrSubscribe component.
 *
 * @property classNames - Optional CSS class overrides for the component and its children
 * @property handleMagicLinkRequested - Callback when a magic link is requested (no subscriber yet)
 * @property handleSubscribe - Callback when subscription/opt-ins are updated (subscriber present)
 * @property verifyData - Optional data passed to child components (e.g. for magic-link verification)
 */
export interface IRequestOrSubscribe {
  classNames?: RequestOrSubscribeClasses
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleSubscribe?: (result: SubscribeResponse) => void
  verifyData?: string
}

/**
 * Optional CSS class overrides for RequestOrSubscribe and its child components.
 *
 * @property button - Class for buttons
 * @property container - Class for the main container
 * @property emailInput - Class for the email input field
 * @property error - Class for error messages
 * @property form - Class for forms
 * @property loading - Class for loading state
 * @property message - Class for message text
 * @property section - Class for section wrappers
 */
export type RequestOrSubscribeClasses = {
  button?: string
  container?: string
  emailInput?: string
  error?: string
  form?: string
  loading?: string
  message?: string
  section?: string
}

/**
 * Composite component that shows Subscribe when a subscriber is authenticated, otherwise
 * RequestMagicLink. Used as a single entry point for "sign in or manage subscriptions."
 *
 * @param props - Component props (see IRequestOrSubscribe)
 * @param props.classNames - Optional class overrides passed to child components
 * @param props.handleMagicLinkRequested - Callback when a magic link is requested (no subscriber yet)
 * @param props.handleSubscribe - Callback when subscription/opt-ins are updated (subscriber present)
 * @param props.verifyData - Optional data passed to child components (e.g. for magic-link verification)
 * @returns Either Subscribe or RequestMagicLink based on subscriber context
 */
export function RequestOrSubscribe({
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
  handleMagicLinkRequested,
  handleSubscribe,
  verifyData,
}: IRequestOrSubscribe) {
  const { subscriber } = useSubscriber()

  return (
    <>
      {subscriber ? (
        <Subscribe
          classNames={classNames}
          handleSubscribe={handleSubscribe}
          verifyData={verifyData}
        />
      ) : (
        <RequestMagicLink
          classNames={classNames}
          handleMagicLinkRequested={handleMagicLinkRequested}
          verifyData={verifyData}
        />
      )}
      {/* <div>subscriber = {JSON.stringify(subscriber)}</div> */}
    </>
  )
}
