'use client'

import { useSubscriber } from '../../contexts/SubscriberProvider.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

// interface IAuth {
//   props?: any
// }

export type SubscriberMenuClasses = {
  button?: string
  container?: string
  group?: string
}

export const SubscriberMenu = ({
  classNames = {
    button: '',
    container: '',
    group: '',
  },
  subscribeUrl,
}: {
  classNames?: SubscriberMenuClasses
  subscribeUrl?: URL
}) => {
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
