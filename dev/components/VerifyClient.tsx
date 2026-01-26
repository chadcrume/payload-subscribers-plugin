'use client'

import type { VerifyMagicLinkResponse } from 'payload-subscribers-plugin/ui'

import { useSubscriber, VerifyMagicLink } from 'payload-subscribers-plugin/ui'

export function VerifyClient() {
  const { refreshSubscriber } = useSubscriber()

  // eslint-disable-next-line @typescript-eslint/require-await
  async function handleMagicLinkVerified(result: VerifyMagicLinkResponse) {
    console.log('handleMagicLinkVerified:', result)
    refreshSubscriber()
  }

  // Example: Conditionally render something or pass the state to children
  return (
    <main id="main-content">
      <h1>Verify</h1>
      <VerifyMagicLink
        classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
        handleMagicLinkVerified={handleMagicLinkVerified}
        showResultBeforeForwarding={true}
      />
    </main>
  )
}
