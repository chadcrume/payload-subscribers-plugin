'use client'

import { useSubscriber } from '@contexts/SubscriberProvider.js'
import Link from 'next/link.js'

import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

// interface IAuth {
//   props?: any
// }

export const SubscriberMenu = ({
  classNames = {
    button: '',
    container: '',
    emailInput: '',
    error: '',
    form: '',
    message: '',
  },
}: {
  classNames?: {
    button: ''
    container: ''
    emailInput: ''
    error: ''
    form: ''
    message: ''
  }
}) => {
  const { logOut, subscriber } = useSubscriber()
  return (
    <div className={mergeClassNames([styles.container, classNames.container])}>
      {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}
      {subscriber && (
        <div>
          Welcome, {subscriber?.email} - <Link href={'/subscribe'}>Manage subscriptions</Link> -{' '}
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
      )}
    </div>
  )
}
