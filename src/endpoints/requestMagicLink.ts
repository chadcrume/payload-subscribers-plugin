import type { CollectionSlug, Endpoint, PayloadHandler, PayloadRequest, TypedUser } from 'payload'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { getHmacHash, getTokenAndHash } from '../helpers/token.js'
import { isAbsoluteURL } from '../helpers/utilities.js'

export type RequestMagicLinkResponse =
  | {
      emailResult: any
      now: string
    }
  | {
      error: string
      now: string
    }

/**
 * Factory that creates the request-magic-link endpoint config and handler.
 * Sends a magic-link email to the given address (creates a pending subscriber if needed).
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - Collection slug for subscribers (default from Subscribers collection)
 * @param options.unsubscribeUrl - The URL to use for unsubscribe links
 * @returns Payload Endpoint config for POST /emailToken
 */
function createEndpointRequestMagicLink({
  subscribersCollectionSlug = defaultCollectionSlug,
  unsubscribeUrl,
}: {
  subscribersCollectionSlug: CollectionSlug
  unsubscribeUrl?: URL
}): Endpoint {
  /**
   * Handler for POST /emailToken. Accepts email and verifyUrl, creates/updates a pending
   * subscriber with a verification token, and sends a magic-link email.
   *
   * @param req - Payload request; body must include `email` and `verifyUrl`
   * @returns 200 with `emailResult` and `now` on success; 400 with `error` and `now` on bad data or email failure
   */
  const requestMagicLinkHandler: PayloadHandler = async (req: PayloadRequest) => {
    const data = req?.json ? await req.json() : {}
    const { email, verifyUrl } = data // if by POST data

    if (!email || !verifyUrl) {
      return Response.json(
        {
          error: 'Email and verifyUrl required',
          now: new Date().toISOString(),
        } as RequestMagicLinkResponse,
        { status: 400 },
      )
    }

    // Make a URL object from verifyUrl
    let verifyUrlObj: undefined | URL
    try {
      verifyUrlObj = !verifyUrl
        ? undefined
        : typeof verifyUrl == 'string' && isAbsoluteURL(verifyUrl)
          ? new URL(verifyUrl)
          : // : config.serverURL
            //   ? new URL(verifyUrl, verifyUrl)
            undefined
    } catch (e) {
      return Response.json(
        {
          error: 'Unable to use verifyUrl' + JSON.stringify(e),
          now: new Date().toISOString(),
        } as RequestMagicLinkResponse,
        { status: 400 },
      )
    }
    if (!verifyUrlObj) {
      return Response.json(
        {
          error: 'Unable to use verifyUrl',
          now: new Date().toISOString(),
        } as RequestMagicLinkResponse,
        { status: 400 },
      )
    }

    const userResults = await req.payload.find({
      collection: subscribersCollectionSlug,
      where: {
        email: { equals: email },
      },
    })
    const user = userResults.docs[0] as TypedUser

    if (!user) {
      //
      // Create subscriber with status 'pending',
      // and an invisible unknowable password,
      //
      const { tokenHash: tokenHash2 } = getTokenAndHash() // Unknowable
      const createResult = await req.payload.create({
        collection: subscribersCollectionSlug,
        data: {
          email,
          password: tokenHash2,
          status: 'pending',
        },
        draft: false,
      })
      if (!createResult) {
        return Response.json(
          {
            error: 'Error creating subscriber',
            now: new Date().toISOString(),
          } as RequestMagicLinkResponse,
          { status: 400 },
        )
      }
    }

    // Update user with verificationToken
    // const token = crypto.randomBytes(32).toString('hex')
    // const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    // const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    const { expiresAt, token, tokenHash } = getTokenAndHash(15 * 60 * 1000)
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
    const magicLink = `${verifyUrlObj?.href}${verifyUrlObj?.search ? '&' : '?'}token=${token}&email=${email}`
    const unsubscribeLink = !unsubscribeUrl
      ? undefined
      : `${unsubscribeUrl?.href}${unsubscribeUrl?.search ? '&' : '?'}email=${email}&hash=${unsubscribeHash}`
    const subject = data.subject || 'Your Magic Login Link'
    const message = `
  ${data.message || '<p>You requested a magic link to log in. Click the button below</p>'}
  <p><a href="${magicLink}"><button><b>Login</b></button></a></p>
  ${unsubscribeLink ? `<p>Click here to <a href="${unsubscribeLink}">unsubscribe</a></p>` : ``}
  `

    const emailResult = await req.payload.sendEmail({
      html: message,
      subject,
      to: user.email,
    })
    //   req.payload.logger.info(`email result: ${JSON.stringify(emailResult)}`)
    // return data; // Return data to allow normal submission if needed
    if (!emailResult) {
      return Response.json(
        {
          error: 'Unknown email result',
          now: new Date().toISOString(),
        } as RequestMagicLinkResponse,
        { status: 400 },
      )
    }
    req.payload.logger.info(`requestMagicLinkHandler email sent \n ${magicLink}`)
    return Response.json({
      emailResult,
      now: new Date().toISOString(),
    } as RequestMagicLinkResponse)
  }

  /** Endpoint config for requesting a magic link. Mount as POST /emailToken. */
  const requestMagicLinkEndpoint: Endpoint = {
    handler: requestMagicLinkHandler,
    method: 'post',
    path: '/emailToken',
  }

  return requestMagicLinkEndpoint
}

export default createEndpointRequestMagicLink
