import type { RequestMagicLinkResponse, SubscribeResponse } from 'payload-subscribers-plugin/ui'

import React from 'react'

// import { Homepage } from '@/components/Homepage'
import { RequestOrSubscribe } from 'payload-subscribers-plugin/ui'

// eslint-disable-next-line @typescript-eslint/require-await
const handleSubscribe = async (result: SubscribeResponse) => {
  'use server'
  console.log('handleSubscribe', result)
}

// eslint-disable-next-line @typescript-eslint/require-await
const handleMagicLinkRequested = async (result: RequestMagicLinkResponse) => {
  'use server'
  console.log('handleSubscribe', result)
}

const Page = () => {
  return (
    <>
      <main id="main-content">
        <h1>Home</h1>
        <RequestOrSubscribe
          classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
          handleMagicLinkRequested={handleMagicLinkRequested}
          handleSubscribe={handleSubscribe}
        />
      </main>
    </>
  )
}

export default Page
