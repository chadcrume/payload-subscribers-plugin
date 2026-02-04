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
}

export const SubscriberMenu = ({
  classNames = {
    button: '',
    container: '',
  },
}: {
  classNames?: SubscriberMenuClasses
}) => {
  const { logOut, subscriber } = useSubscriber()
  return (
    <div className={mergeClassNames([styles.container, classNames.container])}>
      {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}
      {subscriber && (
        <div style={{ display: 'flex' }}>
          <div style={{ flexGrow: 1 }}>Welcome, {subscriber?.email}</div>
          <div style={{ flexGrow: 1 }}>
            <a href={'/subscribe'}>Manage subscriptions</a>
          </div>
          <div style={{ flexGrow: 1 }}>
            <button
              className={mergeClassNames([styles.button, classNames.button])}
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
