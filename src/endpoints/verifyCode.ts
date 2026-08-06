import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { verifySecretAndLogin } from '../helpers/verifyAndLogin.js'

export type VerifyCodeResponse =
  | {
      error: string
      now: string
    }
  | {
      message: string
      now: string
    }

/**
 * Factory that creates the verify-code endpoint config and handler.
 * Validates a submitted login code, marks the subscriber as verified, and logs them in.
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - Collection slug for subscribers (default from Subscribers collection)
 * @returns Payload Endpoint config for POST /verifyCode
 */
function createEndpointVerifyCode({
  subscribersCollectionSlug = defaultCollectionSlug,
}: {
  subscribersCollectionSlug: CollectionSlug
}): Endpoint {
  /**
   * Handler for POST /verifyCode. Validates email + code, updates subscriber password and
   * status, and performs login to set auth cookies.
   *
   * @param req - Payload request; body must include `email` and `code`
   * @returns 200 with `message`, `now` and Set-Cookie on success; 400 with `error` and `now` on bad data, invalid code, or expiry
   */
  const verifyCodeHandler: PayloadHandler = async (req) => {
    const reqData = req?.json ? await req.json() : {}
    const { code, email }: { code: string; email: string } = reqData // if by POST reqData

    if (!email || !code) {
      req.payload.logger.info('verifyCodeHandler Bad data')
      return Response.json(
        { error: 'Bad data', now: new Date().toISOString() } as VerifyCodeResponse,
        { status: 400 },
      )
    }

    return verifySecretAndLogin({
      email,
      req,
      secret: code,
      subscribersCollectionSlug,
    })
  }

  /** Endpoint config for verifying a login code and logging in. Mount as POST /verifyCode. */
  const verifyCodeEndpoint: Endpoint = {
    handler: verifyCodeHandler,
    method: 'post',
    path: '/verifyCode',
  }

  return verifyCodeEndpoint
}

export default createEndpointVerifyCode
