'use client'

import type { RequestMagicLinkResponse, SubscribeResponse } from 'payload-subscribers-plugin/ui'

import React, { useEffect, useState } from 'react'

// import { Homepage } from '@/components/Homepage'
import { RequestOrSubscribe } from 'payload-subscribers-plugin/ui'

export const RequestOrSubscribeClient = ({
  handleMagicLinkRequested,
  handleSubscribe,
}: {
  handleMagicLinkRequested?: (result: RequestMagicLinkResponse) => void
  handleSubscribe?: (result: SubscribeResponse) => void
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
    <RequestOrSubscribe
      classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
      handleMagicLinkRequested={handleMagicLinkRequested}
      handleSubscribe={handleSubscribe}
      verifyUrl={verifyUrl}
    />
  )
}
