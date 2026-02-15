'use client'

import { Subscribe, type SubscribeResponse } from 'payload-subscribers-plugin/ui'
import React, { useEffect, useState } from 'react'

export const SubscribeClient = ({
  handleSubscribe,
}: {
  handleSubscribe: (result: SubscribeResponse) => void
}) => {
  const [verifyData, setVerifyData] = useState<{ forwardURL?: string }>()

  useEffect(() => {
    setVerifyData({
      forwardURL: window.location.href,
    })
  }, [])

  return (
    <>
      <Subscribe
        classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
        handleSubscribe={handleSubscribe}
        verifyData={verifyData ? JSON.stringify(verifyData) : undefined}
      />
    </>
  )
}
