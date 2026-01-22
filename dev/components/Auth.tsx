'use client'

import { useEffect, useState } from 'react'

import { auth } from '../server-functions/auth.js'
import styles from './Auth.module.css'

// interface IAuth {
//   props?: any
// }

export const Auth = () => {
  const [result, setResult] = useState<any>()
  useEffect(() => {
    const getAuth = async () => {
      const { user } = await auth()
      setResult({ user })
    }
    getAuth()
  }, [])
  return (
    <div className={styles.wrapper}>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}
