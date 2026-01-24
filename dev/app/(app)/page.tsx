import React from 'react'
// import { Homepage } from '@/components/Homepage'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import {
  // RequestMagicLink,
  // type RequestMagicLinkResponse,
  Subscribe,
  type SubscribeResponse,
} from 'payload-subscribers-plugin/ui'

const payload = await getPayload({
  config: configPromise,
})

// eslint-disable-next-line @typescript-eslint/require-await
const handleSubscribe = async (result: SubscribeResponse) => {
  'use server'
  console.log('handleSubscribe', result)
}

// // eslint-disable-next-line @typescript-eslint/require-await
// const handleMagicLinkRequested = async (result: RequestMagicLinkResponse) => {
//   'use server'
//   console.log('handleSubscribe', result)
// }

const Page = () => {
  // const x = payload.config.endpoints
  return (
    <>
      <main id="main-content">
        <h1>Home</h1>
        <Subscribe handleSubscribe={handleSubscribe} />
        {/* <RequestMagicLink
          handleMagicLinkRequested={handleMagicLinkRequested}
          showResult={true}
        /> */}
      </main>
    </>
  )
}

export default Page
