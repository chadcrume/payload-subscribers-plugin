import type {
  RequestCodeResponse,
  RequestMagicLinkResponse,
  SubscribeResponse,
} from 'payload-subscribers-plugin/ui'

import { VerifyCode } from 'payload-subscribers-plugin/ui'

import { RequestOrSubscribeClient } from '@/components/RequestOrSubscribeClient.js'

// eslint-disable-next-line @typescript-eslint/require-await
const handleSubscribe = async (result: SubscribeResponse) => {
  'use server'
  console.log('handleSubscribe', result)
}

// eslint-disable-next-line @typescript-eslint/require-await
const handleMagicLinkRequested = async (result: RequestMagicLinkResponse) => {
  'use server'
  console.log('handleSubscribe', result)
}

// eslint-disable-next-line @typescript-eslint/require-await
const handleCodeRequested = async (result: RequestCodeResponse) => {
  'use server'
  console.log('handleCodeRequested', result)
}

// eslint-disable-next-line @typescript-eslint/require-await
const handleCodeVerified = async (result: string) => {
  'use server'
  console.log('handleCodeVerified', result)
}

const Page = () => {
  return (
    <>
      <main id="main-content">
        <h1>Home</h1>
        <RequestOrSubscribeClient
          handleMagicLinkRequested={handleMagicLinkRequested}
          handleSubscribe={handleSubscribe}
        />
        <h2>Or sign in with a code</h2>
        <VerifyCode
          classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
          handleCodeRequested={handleCodeRequested}
          handleCodeVerified={handleCodeVerified}
        />
        <p>
          <a href="/verify-code">Already have a code?</a>
        </p>
      </main>
    </>
  )
}

export default Page
