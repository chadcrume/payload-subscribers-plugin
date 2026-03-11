import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import { cookies as nextCookies } from 'next/headers.js'
import { NextResponse } from 'next/server.js'

import { defaultCollectionSlug } from '../collections/Subscribers.js'

export type LogoutResponse =
  | {
      error: string
      now: string
    }
  | {
      message: string
      now: string
    }

/**
 * Factory that creates the logout endpoint config and handler.
 * Clears the current subscriber session by deleting Payload's cookie directly.
 * (Delegating to Payload's collection logout is causing timing issues with the
 * serverless function to serverless function call.)
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - Collection slug for subscribers (default from Subscribers collection)
 * @returns Payload Endpoint config for POST /logout
 */
function createEndpointLogout({
  subscribersCollectionSlug = defaultCollectionSlug,
}: {
  subscribersCollectionSlug: CollectionSlug
}): Endpoint {
  const logoutHandler: PayloadHandler = async (req) => {
    const collectionLogoutEndpoint = `${req.payload.config.serverURL}/api/${subscribersCollectionSlug}/logout`
    try {
      const cookies = await nextCookies()
      cookies.set('payload-token', '', { expires: new Date(0) })

      return NextResponse.json({
        message: 'Logged out',
        now: new Date().toISOString(),
      } as LogoutResponse)
    } catch (error) {
      req.payload.logger.error(`logoutHandler error: ${JSON.stringify(error, undefined, 2)}`)

      // throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw new Error(
        `Logout failed: ${collectionLogoutEndpoint} : ${JSON.stringify(error, undefined, 2)}`,
        { cause: error },
      )
    }
  }

  /** Endpoint config for subscriber logout. Mount as POST /logout. */
  const logoutEndpoint: Endpoint = {
    handler: logoutHandler,
    method: 'post',
    path: '/logout',
  }

  return logoutEndpoint
}

export default createEndpointLogout
