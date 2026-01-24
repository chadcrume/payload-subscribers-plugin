import React from 'react'
// import { Homepage } from '@/components/Homepage'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { VerifyMagicLink } from 'payload-subscribers-plugin/ui'

import type { VerifyMagicLinkResponse } from '../../../../src/endpoints/verifyMagicLink.js'

const payload = await getPayload({
  config: configPromise,
})

// eslint-disable-next-line @typescript-eslint/require-await
async function handleMagicLinkVerified(result: VerifyMagicLinkResponse) {
  'use server'
  console.log('handleMagicLinkVerified:', result)
}

const Page = async () => {
  return (
    <>
      <main id="main-content">
        <h1>Verify</h1>
        <VerifyMagicLink
          handleMagicLinkVerified={handleMagicLinkVerified}
          showResultBeforeForwarding={true}
        />
      </main>
    </>
  )
}

export default Page
