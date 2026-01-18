import React from 'react'
// import { Homepage } from '@/components/Homepage'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RequestMagicLink } from 'payload-subscribers-plugin/ui'

import type { requestMagicLinkResponse } from '../../src/endpoints/requestMagicLink.js'

const payload = await getPayload({
  config: configPromise,
})

// @ts-nocheck
export async function handleMagicLinkRequested(result: requestMagicLinkResponse) {
  'use server'
  console.log('hi:', result)
}
const Page = () => {
  // const x = payload.config.endpoints
  return (
    <>
      <main id="main-content">
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
