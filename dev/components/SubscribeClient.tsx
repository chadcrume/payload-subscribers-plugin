'use client'

import { Subscribe, type SubscribeResponse } from 'payload-subscribers-plugin/ui'
import React, { useEffect, useState } from 'react'

export const SubscribeClient = ({
  handleSubscribe,
}: {
  handleSubscribe: (result: SubscribeResponse) => void
}) => {
  const [verifyUrl, setVerifyUrl] = useState<URL>()
  useEffect(() => {
    setVerifyUrl(
      new URL(
        `/verify?forwardUrl=${encodeURIComponent(
          window.location.pathname + '?now=' + new Date().toISOString(),
        )}`,
        window.location.protocol + window.location.host,
      ),
    )
  }, [])

  return (
    <Subscribe
      classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
      handleSubscribe={handleSubscribe}
      verifyUrl={verifyUrl}
    />
  )
}
