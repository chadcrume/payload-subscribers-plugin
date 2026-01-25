'use client'

import { useSubscriber } from '@contexts/SubscriberProvider.js'
import Link from 'next/link.js'

import styles from './shared.module.css'

// interface IAuth {
//   props?: any
// }

export const Auth = () => {
  const { logOut, subscriber } = useSubscriber()
  return (
    <div className={styles.container}>
      {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}
      {subscriber && (
        <div>
          Welcome, {subscriber?.email}- <Link href={'/subscribe'}>Manage subscriptions</Link>-{' '}
          <button
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
