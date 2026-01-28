import type { Subscriber } from '@payload-types'

import { headers as nextHeaders } from 'next/headers.js'

// If you're using Next.js, you'll have to import headers from next/headers, like so:
import type { Endpoint, PayloadHandler, Permissions } from 'payload'

export type SubscriberAuthResponse =
  | {
      error: string
      now: string
    }
  | {
      now: string
      permissions: Permissions
      subscriber: Subscriber
    }

/**
 * subscriberAuth Endpoint Handler
 * @param req
 * @returns { status: 200, json: {message: string, now: date} }
 * @returns { status: 400, json: {error: ('No subscriber authed' | catchError | 'Unknown error'), now: date} }
 */
export const subscriberAuthHandler: PayloadHandler = async (req) => {
  // Log the user in via Payload headers
  const headers = await nextHeaders()

  try {
    const { permissions, user } = await req.payload.auth({
      headers,
    })

    // req.payload.logger.info(`user = ${JSON.stringify(user)}`)
    // req.payload.logger.info(`permissions = ${JSON.stringify(permissions)}`)

    if (user && user.collection == 'subscribers') {
      const subscriber: Subscriber = user as Subscriber
      if (subscriber.optIns) {
        subscriber.optIns = subscriber.optIns.map((channel) =>
          typeof channel == 'string' ? channel : channel.id,
        )
      }
      return Response.json({
        now: new Date().toISOString(),
        permissions,
        subscriber,
      } as SubscriberAuthResponse)
    }

    return Response.json(
      {
        error: 'No subscriber authed',
        now: new Date().toISOString(),
      } as SubscriberAuthResponse,
      { headers, status: 400 },
    )
  } catch (error: unknown) {
    req.payload.logger.info(`subscriberAuth error: ${JSON.stringify(error)}`)
    return Response.json(
      {
        error,
        now: new Date().toISOString(),
      } as SubscriberAuthResponse,
      { headers, status: 400 },
    )
  }
}

/**
 * subscriberAuth Endpoint Config
 */
const subscriberAuthEndpoint: Endpoint = {
  handler: subscriberAuthHandler,
  method: 'post',
  path: '/subscriberAuth',
}

export default subscriberAuthEndpoint
