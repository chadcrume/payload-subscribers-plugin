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
  const [verifyData, setVerifyData] = useState<{ forwardURL?: string }>()

  useEffect(() => {
    setVerifyData({
      forwardURL: window.location.href,
    })
  }, [])

  return (
    <RequestOrSubscribe
      classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
      handleMagicLinkRequested={handleMagicLinkRequested}
      handleSubscribe={handleSubscribe}
      verifyData={verifyData ? JSON.stringify(verifyData) : undefined}
    />
  )
}
