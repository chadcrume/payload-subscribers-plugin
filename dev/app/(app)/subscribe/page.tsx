import { Subscribe, type SubscribeResponse } from 'payload-subscribers-plugin/ui'
import React from 'react'

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
        <Subscribe
          classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
          handleSubscribe={handleSubscribe}
        />
      </main>
    </>
  )
}

export default Page
