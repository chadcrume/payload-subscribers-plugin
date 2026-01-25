'use server'

// import type { Subscriber } from '@payload-types'

import type { Subscriber } from '@payload-types'

import config from '@payload-config'
import { logout as payloadNextLogout } from '@payloadcms/next/auth'

// If you're using Next.js, you'll have to import headers from next/headers, like so:
import { headers as nextHeaders } from 'next/headers.js'
import { getPayload, type Payload } from 'payload'

// result will be formatted as follows:
// {
//    permissions: { ... }, // object containing current user's permissions
//    user: { ... }, // currently logged in user's document
//    responseHeaders: { ... } // returned headers from the response
// }

const payload: Payload = await getPayload({ config })

export type SubscriberAuthReturn = { error: any } | { permissions: any; subscriber: any }

export const subscriberAuth = async (): Promise<SubscriberAuthReturn> => {
  // you'll also have to await headers inside your function, or component, like so:
  const headers = await nextHeaders()

  try {
    const { permissions, user } = await payload.auth({
      headers,
    })
    // @ts-expect-error Payload user collection slugs get confused
    if (user && user.collection == 'subscribers') {
      // @ts-expect-error Payload user collection slugs get confused
      const subscriber: Subscriber = user as Subscriber
      if (subscriber.optIns) {
        subscriber.optIns = subscriber.optIns.map((channel) =>
          typeof channel == 'string' ? channel : channel.id,
        )
      }
      return {
        permissions,
        subscriber,
      } as SubscriberAuthReturn
    }

    return { error: 'No subscriber authed' } as SubscriberAuthReturn
  } catch (error) {
    console.log('error', error)
    return { error } as SubscriberAuthReturn
  }
}

export async function logoutAction() {
  try {
    return await payloadNextLogout({ allSessions: true, config })
  } catch (error) {
    throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
