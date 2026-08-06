import type { CollectionSlug, PayloadRequest } from 'payload'
import type { Subscriber } from 'src/copied/payload-types.js'

import { getHash, getTokenAndHash } from './token.js'

export type VerifyAndLoginResult =
  | {
      error: string
      now: string
    }
  | {
      message: string
      now: string
    }

/**
 * Shared implementation for the "verify a hashed, expiring secret and log the subscriber in" step
 * used by both the magic-link and code sign-in flows. Both flows store their secret (link token or
 * numeric code) in the same `verificationToken`/`verificationTokenExpires` fields, so this is the
 * common tail end of both verify endpoints: check the secret, log in via Payload's own `/login`,
 * flip a pending subscriber to subscribed, and return only the Set-Cookie headers.
 *
 * @param options - Verification options
 * @param options.email - Email of the subscriber to verify
 * @param options.req - Payload request (used for payload API access, serverURL, and logging)
 * @param options.secret - The submitted magic-link token or code to check against verificationToken
 * @param options.subscribersCollectionSlug - Collection slug for subscribers
 * @returns A Response: 200 with `message`/`now` and Set-Cookie headers on success; 400 with `error`/`now` otherwise
 */
export async function verifySecretAndLogin({
  email,
  req,
  secret,
  subscribersCollectionSlug,
}: {
  email: string
  req: PayloadRequest
  secret: string
  subscribersCollectionSlug: CollectionSlug
}): Promise<Response> {
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
    req.payload.logger.info('verifySecretAndLogin no user')
    return Response.json(
      { error: 'Bad data', now: new Date().toISOString() } as VerifyAndLoginResult,
      { status: 400 },
    )
  }

  const { tokenHash } = getHash(secret)

  if (!user.verificationTokenExpires || tokenHash != user.verificationToken) {
    req.payload.logger.info(`Token not verified: ${tokenHash} != ${user.verificationToken}`)
    return Response.json(
      { error: 'Token not verified', now: new Date().toISOString() } as VerifyAndLoginResult,
      { status: 400 },
    )
  }

  if (new Date(Date.now()) > new Date(user.verificationTokenExpires)) {
    req.payload.logger.info('verifySecretAndLogin Token expired')
    return Response.json(
      { error: 'Token expired', now: new Date().toISOString() } as VerifyAndLoginResult,
      { status: 400 },
    )
  }

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
    req.payload.logger.info(
      `verifySecretAndLogin catch error ${JSON.stringify(error, undefined, 2)}`,
    )
    throw new Error(`verifySecretAndLogin catch error: ${JSON.stringify(error, undefined, 2)}`, {
      cause: error,
    })
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
  try {
    await req.payload.update({
      collection: subscribersCollectionSlug,
      data,
      where: {
        email: { equals: user.email },
      },
    })
  } catch (error) {
    req.payload.logger.info(
      `verifySecretAndLogin update catch error ${JSON.stringify(error, undefined, 2)}`,
    )
    throw new Error(
      `verifySecretAndLogin update catch error: ${JSON.stringify(error, undefined, 2)}`,
      { cause: error },
    )
  }

  function keepOnlySetCookie(originalHeaders: Headers): Headers {
    const setCookieValues = originalHeaders.getSetCookie()
    const newHeaders = new Headers()
    for (const cookieValue of setCookieValues) {
      newHeaders.append('set-cookie', cookieValue)
    }
    return newHeaders
  }

  const newHeaders = headers ? keepOnlySetCookie(headers) : undefined

  return Response.json(
    {
      message: 'Token verified',
      now: new Date().toISOString(),
    } as VerifyAndLoginResult,
    { headers: newHeaders },
  )
}
