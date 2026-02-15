'use client'

import type { UnsubscribeResponse } from 'payload-subscribers-plugin/ui'

import { Unsubscribe } from 'payload-subscribers-plugin/ui'

export function UnsubscribeClient() {
  // eslint-disable-next-line @typescript-eslint/require-await
  async function handleUnsubscribe(result: UnsubscribeResponse) {
    console.log('handleUnsubscribe:', result)
  }

  // Example: Conditionally render something or pass the state to children
  return (
    <main id="main-content">
      <h1>Unsubscribe</h1>
      <Unsubscribe
        classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
        handleUnsubscribe={handleUnsubscribe}
      >
        <a href={'/subscribe'}>
          <button className={'customCss'} name={'resubscribe'} type="button">
            Resubscribe
          </button>
        </a>
      </Unsubscribe>
    </main>
  )
}
