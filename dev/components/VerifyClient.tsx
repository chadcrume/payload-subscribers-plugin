'use client'

import { useSearchParams } from 'next/navigation.js'
import { VerifyMagicLink } from 'payload-subscribers-plugin/ui'

export function VerifyClient() {
  const searchParams = useSearchParams()
  const verifyDataStr = searchParams.get('verifyData') || undefined
  let verifyData
  try {
    verifyData = JSON.parse(verifyDataStr || '{}')
  } catch (e) {
    verifyData = {}
  }
  const forwardURL = verifyData.forwardURL

  // eslint-disable-next-line @typescript-eslint/require-await
  async function handleMagicLinkVerified(result: string) {
    console.log('handleMagicLinkVerified:', result)
  }

  return (
    <main id="main-content">
      <h1>Verify</h1>
      <VerifyMagicLink
        classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
        handleMagicLinkVerified={handleMagicLinkVerified}
        verifyData={verifyDataStr}
      >
        {forwardURL && (
          <a href={forwardURL}>
            <button className={'customCss'} name={'continue'} type="button">
              Continue
            </button>
          </a>
        )}
      </VerifyMagicLink>
    </main>
  )
}
