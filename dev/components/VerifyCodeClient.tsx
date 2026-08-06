'use client'

import { VerifyCode } from 'payload-subscribers-plugin/ui'

export function VerifyCodeClient() {
  // eslint-disable-next-line @typescript-eslint/require-await
  async function handleCodeVerified(result: string) {
    console.log('handleCodeVerified:', result)
  }

  return (
    <main id="main-content">
      <h1>Verify Code</h1>
      <VerifyCode
        classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
        handleCodeVerified={handleCodeVerified}
      >
        <a href="/">
          <button className={'customCss'} name={'continue'} type="button">
            Continue
          </button>
        </a>
      </VerifyCode>
    </main>
  )
}
