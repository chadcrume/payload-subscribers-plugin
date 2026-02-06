'use client'

import type { VerifyMagicLinkResponse } from 'payload-subscribers-plugin/ui'

import { useSearchParams } from 'next/navigation.js'
import { useSubscriber, VerifyMagicLink } from 'payload-subscribers-plugin/ui'

export function VerifyClient() {
  const searchParams = useSearchParams()
  const forwardUrl = searchParams.get('forwardUrl') || ''
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
      >
        <a href={forwardUrl}>
          <button className={'customCss'} name={'continue'} type="button">
            Continue
          </button>
        </a>
      </VerifyMagicLink>
    </main>
  )
}
