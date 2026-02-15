import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'
import type { Subscriber } from 'src/copied/payload-types.js'

import { defaultCollectionSlug } from '../collections/Subscribers.js'
import { getHmacHash, getTokenAndHash } from '../helpers/token.js'
import { verifyOptIns } from '../helpers/verifyOptIns.js'

export type SubscribeResponse =
  // When subscriber optIns are updated...
  | {
      email: string
      now: string
      optIns: string[]
    }
  // When a verify link is emailed...
  | {
      emailResult: any
      now: string
    }
  // When any error occurs...
  | {
      error: string
      now: string
    }

/**
 * Factory that creates the subscribe endpoint config and handler.
 * Handles new subscriptions (pending + verify email), magic-link resends, and updating
 * opt-ins for already-verified subscribers.
 *
 * @param options - Config options for the endpoint
 * @param options.subscribersCollectionSlug - (required) Collection slug for subscribers (default from Subscribers collection)
 * @param options.unsubscribeURL - (optional) The URL to use for unsubscribe links
 * @param options.verifyURL - (required) The URL to use for verify links
 * @returns Payload Endpoint config for POST /subscribe
 */
function createEndpointSubscribe({
  subscribersCollectionSlug = defaultCollectionSlug,
  unsubscribeURL,
  verifyURL,
}: {
  subscribersCollectionSlug: CollectionSlug
  unsubscribeURL?: URL
  verifyURL: URL
}): Endpoint {
  /**
   * Handler for POST /subscribe. Accepts email and optIns. Creates pending
   * subscribers and sends verify emails, or updates opt-ins for authenticated subscribers.
   *
   * @param req - Payload request. Expects body to be a json object { email, optIns, verifyData? }
   * @returns 200 with `emailResult`/`now`, or `email`/`optIns`/`now` when opt-ins updated; 400 with `error`/`now` on failure
   */
  const subscribeHandler: PayloadHandler = async (req) => {
    const data = req?.json ? await req.json() : {}
    const {
      email,
      optIns,
      verifyData,
    }: {
      email: string
      optIns: string[]
      verifyData?: string
    } = data // if by POST data

    //
    // HELPERS
    // Some of these functions make use of the scope within handler,
    // and would have to be refactored if moved out.
    //
    const createSubscriber = async ({
      optIns,
      password,
      status,
      verificationToken,
      verificationTokenExpires,
    }: {
      email: string
      optIns?: string[]
      password?: string
      status?: 'pending' | 'subscribed' | 'unsubscribed'
      verificationToken?: string
      verificationTokenExpires?: Date
    }) => {
      await req.payload.create({
        collection: subscribersCollectionSlug,
        data: {
          email,
          optIns,
          password,
          status: status || 'pending',
          verificationToken,
          verificationTokenExpires: verificationTokenExpires?.toISOString(),
        },
        draft: false,
      })
    }
    const updateSubscriber = async ({
      id,
      optIns,
      password,
      status,
      verificationToken,
      verificationTokenExpires,
    }: {
      id: string
      optIns?: string[]
      password?: string
      status?: 'pending' | 'subscribed' | 'unsubscribed'
      verificationToken?: string
      verificationTokenExpires?: Date | null
    }) => {
      const updateResults = await req.payload.update({
        id,
        collection: subscribersCollectionSlug,
        data: {
          optIns,
          password,
          status,
          verificationToken,
          verificationTokenExpires: verificationTokenExpires?.toISOString() || null,
        },
        depth: 0,
      })
      return updateResults
    }
    const sendVerifyEmail = async ({
      email,
      linkText,
      message,
      subject,
      token,
      unsubscribeHash,
      unsubscribeURL,
      verifyData,
      verifyURL,
    }: {
      email: string
      linkText: string
      message: string
      subject: string
      token: string
      unsubscribeHash?: string
      unsubscribeURL?: URL
      verifyData?: string
      verifyURL: URL
    }) => {
      const magicLink = `${verifyURL.href}${verifyURL?.search ? '&' : '?'}token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}${verifyData ? `&verifyData=${encodeURIComponent(verifyData)}` : ``}`
      const unsubscribeLink = unsubscribeURL
        ? `${unsubscribeURL.href}${unsubscribeURL.search ? '&' : '?'}email=${encodeURIComponent(email)}&hash=${encodeURIComponent(unsubscribeHash || '')}`
        : undefined
      const html = `
${message}<p><a href="${magicLink}">${linkText}</a></p>
${
  unsubscribeLink ? `<p>Click here to <a href="${unsubscribeLink}"><b>unsubscribe</b></a></p>` : ``
}`

      const emailResult = await req.payload.sendEmail({
        html,
        subject,
        to: email,
      })
      req.payload.logger.info(`subscribe email sent \n ${magicLink}`)
      return emailResult
    }

    //
    // VALIDATE INPUT
    //
    // Require email
    if (!email) {
      req.payload.logger.error(
        JSON.stringify(
          { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse,
          undefined,
          2,
        ),
      )
      return Response.json(
        { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse,
        { status: 400 },
      )
    }

    //
    // Validate OptInChannels
    const { invalidOptInsInput, verifiedOptInIDs } = await verifyOptIns(req.payload, optIns)

    if (invalidOptInsInput) {
      req.payload.logger.error(
        JSON.stringify(
          {
            error: 'Invalid input: ' + JSON.stringify(optIns),
            now: new Date().toISOString(),
          } as SubscribeResponse,
          undefined,
          2,
        ),
      )
      return Response.json(
        {
          error: 'Invalid input: ' + JSON.stringify(optIns),
          now: new Date().toISOString(),
        } as SubscribeResponse,
        { status: 400 },
      )
    }

    //
    // Verify subscriber exists
    const userResults = await req.payload.find({
      collection: subscribersCollectionSlug,
      where: {
        email: { equals: email },
      },
    })
    const subscriber = userResults.docs[0] as Subscriber

    //
    // Now we have a subscriber and validatedOptIns
    // Handle scenarios

    //
    // Create the hash for an unsubscribe link
    const { hashToken: unsubscribeHash } = getHmacHash(email)

    //
    // ********************************************************
    //
    if (req.user && req.user.email != email) {
      //
      // Error: Auth-ed user doesn't match subscriber email
      //
      req.payload.logger.error(
        JSON.stringify(
          {
            error: 'Unauthorized: ' + email,
            now: new Date().toISOString(),
          } as SubscribeResponse,
          undefined,
          2,
        ),
      )
      return Response.json(
        {
          error: 'Unauthorized: ' + email,
          now: new Date().toISOString(),
        } as SubscribeResponse,
        { status: 400 },
      )
    }

    //
    // ********************************************************
    //
    if (!subscriber) {
      //
      // Create subscriber with status 'pending',
      // and an invisible unknowable password,
      // and send a verify email
      // Pass all optIns through verify link
      //
      const { expiresAt, token, tokenHash } = getTokenAndHash(15 * 60 * 1000) // Use for magic link
      const { tokenHash: tokenHash2 } = getTokenAndHash() // Unknowable
      await createSubscriber({
        email,
        optIns,
        password: tokenHash2,
        status: 'pending',
        verificationToken: tokenHash,
        verificationTokenExpires: expiresAt,
      })

      //
      // Send email
      const emailResult = await sendVerifyEmail({
        email,
        linkText: '<b>Verify</b>',
        message: data.message || `<p>Click here to verify your subscription:</p>`,
        subject: data.subject || 'Please verify your subscription',
        token,
        unsubscribeHash,
        unsubscribeURL,
        verifyData,
        verifyURL,
      })
      if (!emailResult) {
        req.payload.logger.error(
          JSON.stringify(
            { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
            undefined,
            2,
          ),
        )
        return Response.json(
          { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
          { status: 400 },
        )
      }
      return Response.json({ emailResult, now: new Date().toISOString() } as SubscribeResponse)
      //
    }
    //
    // ********************************************************
    //
    if (!req.user && subscriber) {
      //
      // Send magic link to log the user in
      // Pass all optIns through verify link
      //
      const { expiresAt, token, tokenHash } = getTokenAndHash(15 * 60 * 1000) // Use for magic link
      // Update subscriber with token for pending email
      const updateResults = await updateSubscriber({
        id: subscriber.id,
        verificationToken: tokenHash,
        verificationTokenExpires: expiresAt,
      })
      if (!updateResults) {
        req.payload.logger.error(
          JSON.stringify(
            { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
            undefined,
            2,
          ),
        )
        return Response.json(
          { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
          { status: 400 },
        )
      }

      //
      // Send email
      const emailResult = await sendVerifyEmail({
        email,
        linkText: 'Verify',
        message: data.message || `<h1>Click here to verify your subscription:</h1>`,
        subject: data.subject || 'Please verify your subscription',
        token,
        unsubscribeHash,
        unsubscribeURL,
        verifyData,
        verifyURL,
      })
      if (!emailResult) {
        req.payload.logger.error(
          JSON.stringify(
            { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
            undefined,
            2,
          ),
        )
        return Response.json(
          { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
          { status: 400 },
        )
      }
      return Response.json({ emailResult, now: new Date().toISOString() } as SubscribeResponse)
    }
    //
    // ********************************************************
    //
    if (req.user && subscriber && subscriber.status == 'pending') {
      //
      // Send magic link to verify the email and log the user in
      // Pass all optIns through verify link
      //
      const { expiresAt, token, tokenHash } = getTokenAndHash(15 * 60 * 1000) // Use for magic link
      // Create subscriber with token for pending email
      const updateResults = await updateSubscriber({
        id: subscriber.id,
        verificationToken: tokenHash,
        verificationTokenExpires: expiresAt,
      })
      if (!updateResults) {
        req.payload.logger.error(
          JSON.stringify(
            { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
            undefined,
            2,
          ),
        )
        return Response.json(
          { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
          { status: 400 },
        )
      }

      const emailResult = await sendVerifyEmail({
        email,
        linkText: 'Verify',
        message: data.message || `<h1>Click here to verify your email:</h1>`,
        subject: data.subject || 'Please verify your subscription',
        token,
        unsubscribeHash,
        unsubscribeURL,
        verifyData,
        verifyURL,
      })
      if (!emailResult) {
        req.payload.logger.error(
          JSON.stringify(
            { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
            undefined,
            2,
          ),
        )
        return Response.json(
          { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
          { status: 400 },
        )
      }
      return Response.json({ emailResult, now: new Date().toISOString() } as SubscribeResponse)
    }

    //
    // ********************************************************
    //
    if (req.user && subscriber && subscriber.status != 'pending') {
      //
      // Update subscriber with status 'subscribed',
      // an invisible unknowable password,
      // and if any optIns input exists, set subscriber optIns
      // to EXACTLY verifiedOptInIDs (potentially unsubscribing from any not in verifiedOptInIDs)
      //
      const { tokenHash } = getTokenAndHash() // Use for magic link
      // Update subscriber with optIns
      const updateResults = (await updateSubscriber({
        id: subscriber.id,
        optIns: verifiedOptInIDs,
        password: tokenHash,
        status: 'subscribed',
        verificationToken: '',
        verificationTokenExpires: null,
      })) as Subscriber

      // Return results, including the verified optIns
      return Response.json({
        email: updateResults.email,
        now: new Date().toISOString(),
        optIns: updateResults.optIns,
      } as SubscribeResponse)
    }
    //
    // Uncaught case
    //
    req.payload.logger.error(
      JSON.stringify(
        { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
        undefined,
        2,
      ),
    )
    return Response.json(
      { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
      { status: 400 },
    )
  }

  /** Endpoint config for subscription and opt-in updates. Mount as POST /subscribe. */
  const subscribeEndpoint: Endpoint = {
    handler: subscribeHandler,
    method: 'post',
    path: '/subscribe',
  }

  return subscribeEndpoint
}

export default createEndpointSubscribe
