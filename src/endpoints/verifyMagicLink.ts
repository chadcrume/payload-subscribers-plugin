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
    // req.payload.logger.info('verifyMagicLinkHandler')
    const reqData = req?.json ? await req.json() : {}
    const { email, token }: { email: string; token: string } = reqData // if by POST reqData
    // const { email, token } = req.routeParams // if by path

    if (!email || !token) {
      req.payload.logger.info('verifyMagicLinkHandler Bad data')
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
      req.payload.logger.info('verifyMagicLinkHandler no user')
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
      req.payload.logger.info(`Token not verified: ${tokenHash} != ${user.verificationToken}`)
      return Response.json(
        { error: 'Token not verified', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    if (new Date(Date.now()) > new Date(user.verificationTokenExpires)) {
      req.payload.logger.info('verifyMagicLinkHandler Token expired')
      return Response.json(
        { error: 'Token expired', now: new Date().toISOString() } as VerifyMagicLinkResponse,
        { status: 400 },
      )
    }

    // req.payload.logger.info(
    //   `verifyMagicLinkHandler user found and token validated, prepping to authencticate ${user.email}`,
    // )
    // Update user with token password
    await req.payload.update({
      collection: subscribersCollectionSlug,
      data: {
        password: tokenHash,
      },
      disableTransaction: true,
      where: {
        email: { equals: user.email },
      },
    })
    // req.payload.logger.info(
    //   'verifyMagicLinkHandler user found and token validated, prepping to authencticate DONE',
    // )

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
      req.payload.logger.info(
        `verifyMagicLinkHandler catch error ${JSON.stringify(error, undefined, 2)}`,
      )
      throw new Error(
        `verifyMagicLinkHandler catch error: ${JSON.stringify(error, undefined, 2)}`,
        { cause: error },
      )
      // return Response.json({ error } as VerifyMagicLinkResponse, { status: 400 })
    }

    const status: 'pending' | 'subscribed' | 'unsubscribed' | undefined =
      user?.status == 'pending' ? 'subscribed' : user?.status

    const { tokenHash: tokenHash2 } = getTokenAndHash() // Unknowable
    const data = {
      password: tokenHash2,
      status,
      verificationToken: '',
      verificationTokenExpires: null,
    }
    let updateResult
    try {
      // Update user
      updateResult = await req.payload.update({
        collection: subscribersCollectionSlug,
        data,
        where: {
          email: { equals: user.email },
        },
      })
    } catch (error) {
      // console.log(error)
      req.payload.logger.info(
        `verifyMagicLinkHandler update catch error ${JSON.stringify(error, undefined, 2)}`,
      )
      throw new Error(
        `verifyMagicLinkHandler update catch error: ${JSON.stringify(error, undefined, 2)}`,
        { cause: error },
      )
      // return Response.json({ error } as VerifyMagicLinkResponse, { status: 400 })
    }

    function keepOnlySetCookie(originalHeaders: Headers): Headers {
      // Use getSetCookie() to get all values as an array
      const setCookieValues = originalHeaders.getSetCookie()

      // Create a new Headers object
      const newHeaders = new Headers()

      // Append each 'set-cookie' value individually
      for (const cookieValue of setCookieValues) {
        newHeaders.append('set-cookie', cookieValue)
      }

      return newHeaders
    }

    const newHeaders = headers ? keepOnlySetCookie(headers) : undefined
    // req.payload.logger.info(
    //   `verifyMagicLinkHandler headers ${JSON.stringify(headers?.entries(), undefined, 2)}`,
    // )
    // req.payload.logger.info(
    //   `verifyMagicLinkHandler newHeaders ${JSON.stringify(newHeaders?.entries(), undefined, 2)}`,
    // )

    return Response.json(
      {
        message: 'Token verified',
        now: new Date().toISOString(),
      } as VerifyMagicLinkResponse,
      { headers: newHeaders },
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
