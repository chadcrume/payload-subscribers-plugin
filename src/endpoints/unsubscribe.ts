import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'
import type { Subscriber } from 'src/copied/payload-types.js'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { getHmacHash } from '../helpers/token.js'

export type SubscribeResponse =
  // When unsubscriber status is set to 'unsubscribed'...
  | {
      error: string
      now: string
    }
  // When any error occurs...
  | {
      message: string
      now: string
    }

/**
 * Factory that creates the unsubscribe endpoint config and handler.
 * Handles completely unsubscribing a subscriber by marking their
 * status as 'unsubscribed'.
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - Collection slug for subscribers (default from Subscribers collection)
 * @returns Payload Endpoint config for POST /unsubscribe
 */
function createEndpointSubscribe({
  subscribersCollectionSlug = defaultCollectionSlug,
}: {
  subscribersCollectionSlug: CollectionSlug
}): Endpoint {
  /**
   * Handler for POST /unsubscribe. Accepts email, optIns, and verifyUrl. Creates pending
   * subscribers and sends verify emails, or updates opt-ins for authenticated subscribers.
   *
   * @param req - Payload request; body: `email`, `optIns` (channel IDs), `verifyUrl`
   * @returns 200 with `emailResult`/`now`, or `email`/`optIns`/`now` when opt-ins updated; 400 with `error`/`now` on failure
   */
  const unsubscribeHandler: PayloadHandler = async (req) => {
    const data = req?.json ? await req.json() : {}
    const { email, unsubscribeToken }: { email: string; unsubscribeToken: string } = await data // if by POST data
    // const { email } = req.routeParams // if by path

    //
    // VALIDATE INPUT
    //
    // Require unsubscribeToken
    if (!unsubscribeToken) {
      const result = { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse
      req.payload.logger.error(JSON.stringify(result, undefined, 2))
      return Response.json(result)
    }

    //
    // Verify unsubscribeToken
    const { hashToken: verifyUnsubscribeToken } = getHmacHash(email)
    if (unsubscribeToken != verifyUnsubscribeToken) {
      const result = { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse
      req.payload.logger.error(JSON.stringify(result, undefined, 2))
      return Response.json(result)
    }

    //
    // Require subscriber exists
    const userResults = await req.payload.find({
      collection: subscribersCollectionSlug,
      where: {
        email: { equals: email },
      },
    })
    const subscriber = userResults.docs[0] as Subscriber

    if (!subscriber) {
      const result = { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse
      req.payload.logger.error(JSON.stringify(result, undefined, 2))
      return Response.json(result)
    }

    //
    // Require authed user to match incoming email
    if (req.user && req.user.email != subscriber.email) {
      //
      // Error: Auth-ed user doesn't match subscriber email
      //
      const result = {
        error: 'Unauthorized: ' + subscriber.email,
        now: new Date().toISOString(),
      } as SubscribeResponse
      req.payload.logger.error(JSON.stringify(result, undefined, 2))
      return Response.json(result)
    }

    //
    // Now we have a validated subscriber and unsubscribeToken
    // Mark as unsubscribed

    const updateResults = await req.payload.update({
      id: subscriber.id,
      collection: subscribersCollectionSlug,
      data: {
        status: 'unsubscribed',
      },
      depth: 0,
    })
    if (!updateResults) {
      const result = {
        error: 'Unable to unsubscribe. Please try again.',
        now: new Date().toISOString(),
      } as SubscribeResponse
      req.payload.logger.error(JSON.stringify(result, undefined, 2))
      return Response.json(result, { status: 400 })
    }

    //
    // Uncaught case
    //
    const result = { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse
    req.payload.logger.error(JSON.stringify(result, undefined, 2))
    return Response.json(result, { status: 400 })
  }

  /** Endpoint config for subscription and opt-in updates. Mount as POST /subscribe. */
  const unsubscribeEndpoint: Endpoint = {
    handler: unsubscribeHandler,
    method: 'post',
    path: '/unsubscribe',
  }

  return unsubscribeEndpoint
}

export default createEndpointSubscribe
