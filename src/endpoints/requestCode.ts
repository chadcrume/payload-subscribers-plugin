import type { CollectionSlug, Endpoint, PayloadHandler, PayloadRequest } from 'payload'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { findOrCreatePendingSubscriber } from '../helpers/subscriber.js'
import { getCodeAndHash, getHmacHash } from '../helpers/token.js'

export type RequestCodeResponse =
  | {
      emailResult: any
      now: string
    }
  | {
      error: string
      now: string
    }

/**
 * Factory that creates the request-code endpoint config and handler.
 * Sends a one-time login code email to the given address (creates a pending subscriber if needed).
 *
 * Stores the code hash in the same `verificationToken`/`verificationTokenExpires` fields used by
 * the magic-link flow. If a project offers both flows, requesting one after the other overwrites
 * the earlier pending link/code for that subscriber.
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - (required) Collection slug for subscribers (default from Subscribers collection)
 * @param options.unsubscribeURL - (optional) The URL to use for unsubscribe links
 * @returns Payload Endpoint config for POST /emailCode
 */
function createEndpointRequestCode({
  subscribersCollectionSlug = defaultCollectionSlug,
  unsubscribeURL,
}: {
  subscribersCollectionSlug: CollectionSlug
  unsubscribeURL?: URL
}): Endpoint {
  /**
   * Handler for POST /emailCode. Takes an email parameter. Creates/updates a pending
   * subscriber with a verification code, and emails the code.
   *
   * @param req - Payload request. Expects body to be a json object { email }
   * @returns 200 with `emailResult` and `now` on success; 400 with `error` and `now` on bad data or email failure
   */
  const requestCodeHandler: PayloadHandler = async (req: PayloadRequest) => {
    const data = req?.json ? await req.json() : {}
    const { email } = data // if by POST data

    if (!email) {
      return Response.json(
        {
          error: 'Email required',
          now: new Date().toISOString(),
        } as RequestCodeResponse,
        { status: 400 },
      )
    }

    const user = await findOrCreatePendingSubscriber({ email, req, subscribersCollectionSlug })

    if (!user) {
      return Response.json(
        {
          error: 'Error creating subscriber',
          now: new Date().toISOString(),
        } as RequestCodeResponse,
        { status: 400 },
      )
    }

    const { code, expiresAt, tokenHash } = getCodeAndHash(15 * 60 * 1000)
    await req.payload.update({
      collection: subscribersCollectionSlug,
      data: {
        verificationToken: tokenHash,
        verificationTokenExpires: expiresAt?.toISOString(),
      },
      where: {
        email: { equals: user.email },
      },
    })
    const { hashToken: unsubscribeHash } = getHmacHash(email)

    // Send email
    const unsubscribeLink = !unsubscribeURL
      ? undefined
      : `${unsubscribeURL?.href}${unsubscribeURL?.search ? '&' : '?'}email=${encodeURIComponent(email)}&hash=${encodeURIComponent(unsubscribeHash)}`
    const subject = data.subject || 'Your Login Code'
    const message = `
  ${data.message || '<p>You requested a login code. Enter the code below to log in</p>'}
  <p style="font-size: 1.5em; font-weight: bold; letter-spacing: 0.2em;">${code}</p>
  ${unsubscribeLink ? `<p>Click here to <a href="${unsubscribeLink}">unsubscribe</a></p>` : ``}
  `

    const emailResult = await req.payload.sendEmail({
      html: message,
      subject,
      to: user.email,
    })
    if (!emailResult) {
      return Response.json(
        {
          error: 'Unknown email result',
          now: new Date().toISOString(),
        } as RequestCodeResponse,
        { status: 400 },
      )
    }
    req.payload.logger.info(`requestCodeHandler email sent \n ${code}`)
    return Response.json({
      emailResult,
      now: new Date().toISOString(),
    } as RequestCodeResponse)
  }

  /** Endpoint config for requesting a login code. Mount as POST /emailCode. */
  const requestCodeEndpoint: Endpoint = {
    handler: requestCodeHandler,
    method: 'post',
    path: '/emailCode',
  }

  return requestCodeEndpoint
}

export default createEndpointRequestCode
