import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import { headers as nextHeaders } from 'next/headers.js'

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
 * Clears the current subscriber session by delegating to Payload's collection logout.
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
    const headers = await nextHeaders()

    try {
      const logoutResult = await fetch(
        `${req.payload.config.serverURL}/api/${subscribersCollectionSlug}/logout`,
        {
          headers,
          method: 'POST',
        },
      )

      const logoutResultData = await logoutResult.json()

      if (logoutResult.ok) {
        return Response.json({
          message: logoutResultData.message,
          now: new Date().toISOString(),
        } as LogoutResponse)
      }

      if (
        logoutResult.status == 400 &&
        logoutResultData.errors?.map((e: { message: string }) => e.message).includes('No User')
      ) {
        return Response.json(
          {
            error: `Logout failed: 'No User'`,
            now: new Date().toISOString(),
          } as LogoutResponse,
          {
            status: 400,
          },
        )
      }
      return Response.json(
        {
          error: `Logout failed: ${
            logoutResultData.errors
              ? logoutResultData.errors?.map((e: { message: string }) => e.message).join(' // ')
              : JSON.stringify(logoutResultData)
          }`,
          now: new Date().toISOString(),
        } as LogoutResponse,
        {
          status: 400,
        },
      )
    } catch (error) {
      // throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return Response.json(
        {
          error: `Logout failed: ${JSON.stringify(error)}`,
          now: new Date().toISOString(),
        } as LogoutResponse,
        {
          status: 400,
        },
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
