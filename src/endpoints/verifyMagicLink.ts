import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { verifySecretAndLogin } from '../helpers/verifyAndLogin.js'

export type VerifyMagicLinkResponse =
  | {
      error: string
      now: string
    }
  | {
      message: string
      now: string
    }

/**
 * Factory that creates the verify-magic-link endpoint config and handler.
 * Validates token from the magic link, marks the subscriber as verified, and logs them in.
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - Collection slug for subscribers (default from Subscribers collection)
 * @returns Payload Endpoint config for POST /verifyToken
 */
function createEndpointVerifyMagicLink({
  subscribersCollectionSlug = defaultCollectionSlug,
}: {
  subscribersCollectionSlug: CollectionSlug
}): Endpoint {
  /**
   * Handler for POST /verifyToken. Validates email + token from magic link, updates subscriber
   * password and status, and performs login to set auth cookies.
   *
   * @param req - Payload request; body must include `email` and `token`
   * @returns 200 with `message`, `now` and Set-Cookie on success; 400 with `error` and `now` on bad data, invalid token, or expiry
   */
  const verifyMagicLinkHandler: PayloadHandler = async (req) => {
    const reqData = req?.json ? await req.json() : {}
    const { email, token }: { email: string; token: string } = reqData // if by POST reqData

    if (!email || !token) {
      req.payload.logger.info('verifyMagicLinkHandler Bad data')
      return Response.json(
        { error: 'Bad data', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    return verifySecretAndLogin({
      email,
      req,
      secret: token,
      subscribersCollectionSlug,
    })
  }

  /** Endpoint config for verifying magic link and logging in. Mount as POST /verifyToken. */
  const verifyMagicLinkEndpoint: Endpoint = {
    handler: verifyMagicLinkHandler,
    method: 'post',
    path: '/verifyToken',
  }

  return verifyMagicLinkEndpoint
}

export default createEndpointVerifyMagicLink
