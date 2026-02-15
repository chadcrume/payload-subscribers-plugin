'use client'

import type { Subscriber } from '../../copied/payload-types.js'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import { isAbsoluteURL } from '../../helpers/utilities.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

/**
 * Props for the SubscriberMenu component.
 *
 * @property classNames - Optional CSS class overrides for the component elements
 * @property subscribeUrl - If set, shows a "Manage subscriptions" link to this URL (string or URL)
 */
export interface ISubscriberMenu {
  classNames?: SubscriberMenuClasses
  subscribeUrl?: string | URL
}

/**
 * Optional CSS class overrides for SubscriberMenu elements.
 *
 * @property button - Class for the logout button
 * @property container - Class for the main container
 * @property group - Class for the inner group (welcome, link, button)
 */
export type SubscriberMenuClasses = {
  button?: string
  container?: string
  group?: string
}

/**
 * Displays subscriber UI when authenticated: welcome message, optional "Manage subscriptions" link,
 * and a logout button. Renders nothing when no subscriber is in context.
 *
 * @param props - Component props (see ISubscriberMenu)
 * @param props.classNames - Optional class overrides for container, group, and button
 * @param props.subscribeUrl - If set, shows a "Manage subscriptions" link to this URL
 * @returns Container with welcome text, subscribe link (if subscribeUrl), and Log out button, or null
 */
export const SubscriberMenu = ({
  classNames = {
    button: '',
    container: '',
    group: '',
  },
  subscribeUrl,
}: ISubscriberMenu) => {
  // Get a URL object from the subscribeUrl option
  subscribeUrl = !subscribeUrl
    ? undefined
    : typeof subscribeUrl == 'string' && isAbsoluteURL(subscribeUrl)
      ? new URL(subscribeUrl)
      : window.location
        ? new URL(subscribeUrl, window.location.protocol + window.location.host)
        : undefined

  const { logOut, subscriber } = useSubscriber()

  return (
    <div
      className={mergeClassNames([
        'subscribers-menu subscribers-container',
        styles.container,
        classNames.container,
      ])}
    >
      {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}
      {subscriber && (
        <div className={mergeClassNames(['subscribers-group', styles.group, classNames.group])}>
          <div className="subscribers-welcome">Welcome, {subscriber?.email}</div>
          {subscribeUrl && (
            <div className="subscribers-subs-link">
              <a href={subscribeUrl.href}>Manage subscriptions</a>
            </div>
          )}
          <div className="subscribers-logout">
            <button
              className={mergeClassNames(['subscribers-button', styles.button, classNames.button])}
              onClick={(e) => {
                e.preventDefault()
                logOut()
              }}
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
