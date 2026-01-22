import React from 'react'
// import { Homepage } from '@/components/Homepage'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RequestMagicLink } from 'payload-subscribers-plugin/ui'

import type { RequestMagicLinkResponse } from '../../../src/endpoints/requestMagicLink.js'

import { Auth } from '../../components/Auth.js'

const payload = await getPayload({
  config: configPromise,
})

// eslint-disable-next-line @typescript-eslint/require-await
export async function handleMagicLinkRequested(result: RequestMagicLinkResponse) {
  'use server'
  console.log('handleMagicLinkRequested:', result)
}
const Page = () => {
  // const x = payload.config.endpoints
  return (
    <>
      <main id="main-content">
        <h1>Home</h1>
        <Auth />
        <RequestMagicLink
          baseURL={payload.config.serverURL}
          handleMagicLinkRequested={handleMagicLinkRequested}
          showResult={true}
        />
      </main>
    </>
  )
}

export default Page
