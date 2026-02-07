import { headers as nextHeaders } from 'next/headers.js'

import type { Subscriber } from '../copied/payload-types.js'

// If you're using Next.js, you'll have to import headers from next/headers, like so:
import type { CollectionSlug, Endpoint, PayloadHandler, Permissions } from 'payload'

import { defaultCollectionSlug } from '../collections/Subscribers.js'

export type SubscriberAuthResponse =
  | {
      error: string
      now: string
    }
  | {
      now: string
      permissions: Permissions
      subscriber: null | Subscriber
    }

/**
 * Factory that creates the subscriber-auth endpoint config and handler.
 * Authenticates the current request via Payload auth and returns the subscriber and permissions if from the subscribers collection.
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - Collection slug for subscribers (default from Subscribers collection)
 * @returns Payload Endpoint config for POST /subscriberAuth
 */
function createEndpointSubscriberAuth({
  subscribersCollectionSlug = defaultCollectionSlug,
}: {
  subscribersCollectionSlug: CollectionSlug
}): Endpoint {
  /**
   * Handler for POST /subscriberAuth. Uses Payload auth (e.g. cookies) to resolve the current user;
   * if the user belongs to the subscribers collection, returns subscriber and permissions.
   *
   * @param req - Payload request (auth via headers)
   * @returns 200 with `subscriber`, `permissions`, `now` when a subscriber is authed; 400 with `subscriber: null` or `error` otherwise
   */
  const subscriberAuthHandler: PayloadHandler = async (req) => {
    // req.payload.logger.info('subscriberAuthHandler')
    // Log the user in via Payload headers
    const headers = await nextHeaders()

    try {
      const { permissions, user } = await req.payload.auth({
        headers,
      })

      // req.payload.logger.info(`user = ${JSON.stringify(user)}`)
      // req.payload.logger.info(`permissions = ${JSON.stringify(permissions)}`)

      if (user && user.collection == subscribersCollectionSlug) {
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

      // req.payload.logger.info('subscriberAuthHandler: No subscriber authed')
      return Response.json(
        {
          // error: 'No subscriber authed',
          now: new Date().toISOString(),
          permissions,
          subscriber: null,
        } as SubscriberAuthResponse,
        { headers, status: 400 },
      )
    } catch (error: unknown) {
      // req.payload.logger.info(`subscriberAuth error: ${JSON.stringify(error)}`)
      return Response.json(
        {
          error,
          now: new Date().toISOString(),
        } as SubscriberAuthResponse,
        { headers, status: 400 },
      )
    }
  }

  /** Endpoint config for checking current subscriber auth. Mount as POST /subscriberAuth. */
  const subscriberAuthEndpoint: Endpoint = {
    handler: subscriberAuthHandler,
    method: 'post',
    path: '/subscriberAuth',
  }
  return subscriberAuthEndpoint
}

export default createEndpointSubscriberAuth
