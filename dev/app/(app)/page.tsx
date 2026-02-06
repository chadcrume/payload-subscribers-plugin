import type { RequestMagicLinkResponse, SubscribeResponse } from 'payload-subscribers-plugin/ui'

import { RequestOrSubscribeClient } from '@/components/RequestOrSubscribeClient.js'

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
        <RequestOrSubscribeClient
          handleMagicLinkRequested={handleMagicLinkRequested}
          handleSubscribe={handleSubscribe}
        />
      </main>
    </>
  )
}

export default Page
