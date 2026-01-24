'use client'

import { getServerUrl } from '@server-functions/serverUrl.js'
import { useEffect, useState } from 'react'

// Custom hook to easily consume the context and add error handling
export function useServerUrl() {
  const [serverURL, setServerURL] = useState<string>()
  useEffect(() => {
    const fetchServerUrl = async () => {
      const { serverURL } = await getServerUrl()
      setServerURL(serverURL)
    }
    void fetchServerUrl()
  }, [])
  return { serverURL }
}
