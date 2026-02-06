import type { SubscribeResponse } from 'payload-subscribers-plugin/ui'

import { SubscribeClient } from '@/components/SubscribeClient.js'

// eslint-disable-next-line @typescript-eslint/require-await
async function handleSubscribe(result: SubscribeResponse) {
  'use server'
  console.log('handleSubscribe:', result)
}

const Page = () => {
  return (
    <>
      <main id="main-content">
        <h1>Subscribe</h1>
        <SubscribeClient handleSubscribe={handleSubscribe} />
      </main>
    </>
  )
}

export default Page
