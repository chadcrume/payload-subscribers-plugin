import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'
import type { Subscriber } from 'src/copied/payload-types.js'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { getHash, getTokenAndHash } from '../helpers/token.js'

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
    // const { email, token } = req.routeParams // if by path

    if (!email || !token) {
      return Response.json(
        { error: 'Bad data', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    const userResults = await req.payload.find({
      collection: subscribersCollectionSlug,
      where: {
        email: { equals: email },
      },
    })

    type SubscriberType = {
      // @ts-expect-error Why is this not correct, isn't it how Payload does it?
      collection: subscribersCollectionSlug
    } & Subscriber

    const user = userResults.docs[0] as SubscriberType

    if (!user) {
      return Response.json(
        { error: 'Bad data', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    const { tokenHash } = getHash(token)

    // req.payload.logger.info(
    //   `verifyMagicLinkHandler ${email} \n ${tokenHash} \n ${user.verificationTokenExpires} \n ${user.verificationToken}`,
    // )
    if (!user.verificationTokenExpires || tokenHash != user.verificationToken) {
      // req.payload.logger.info(`Token not verified: ${tokenHash} != ${user.verificationToken}`)
      return Response.json(
        { error: 'Token not verified', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    if (new Date(Date.now()) > new Date(user.verificationTokenExpires)) {
      return Response.json(
        { error: 'Token expired', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    // Update user
    await req.payload.update({
      collection: subscribersCollectionSlug,
      data: {
        password: tokenHash,
      },
      where: {
        email: { equals: user.email },
      },
    })

    // Log the user in via Payload headers
    let headers
    try {
      const loginReq = await fetch(
        `${req.payload.config.serverURL}/api/${subscribersCollectionSlug}/login`,
        {
          body: JSON.stringify({
            email,
            password: tokenHash,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )
      if (loginReq && loginReq.ok) {
        headers = loginReq.headers
      }
    } catch (error) {
      // console.log(error)
      return Response.json({ error } as VerifyMagicLinkResponse, { status: 400 })
    }
    // console.log('login', headers)

    const { tokenHash: tokenHash2 } = getTokenAndHash() // Unknowable
    const data = {
      password: tokenHash2,
      status: 'subscribed' as 'pending' | 'subscribed' | 'unsubscribed' | undefined,
      verificationToken: '',
      verificationTokenExpires: null,
    }
    // Update user
    await req.payload.update({
      collection: subscribersCollectionSlug,
      data,
      where: {
        email: { equals: user.email },
      },
    })

    return Response.json(
      {
        message: 'Token verified',
        now: new Date().toISOString(),
      } as VerifyMagicLinkResponse,
      { headers },
    )
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
