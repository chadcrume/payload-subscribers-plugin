import React from 'react'
// import { Homepage } from '@/components/Homepage'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Subscribe } from 'payload-subscribers-plugin/ui'

import type { SubscribeResponse } from '../../../../src/endpoints/subscribe.js'

const payload = await getPayload({
  config: configPromise,
})

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
        <Subscribe handleSubscribe={handleSubscribe} />
      </main>
    </>
  )
}

export default Page
