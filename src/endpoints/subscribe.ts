import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import OptInChannels from '@collections/OptInChannels.js'
import crypto from 'crypto'

export type SubscribeResponse =
  | {
      email: string
      now: string
      optIns: string[]
    }
  | {
      emailResult: any
      now: string
    }
  | {
      error: string
      now: string
    }

/**
 * subscribe Endpoint Handler
 * @param req
 * @data { email }
 * @returns { status: 200, json: {message: string, now: date} }
 * @returns { status: 400, json: {error: ('Bad data' | 'Already subscribed' | 'Unknown email result'), now: date} }
 */
export const subscribeHandler: PayloadHandler = async (req) => {
  const data = req?.json ? await req.json() : {}
  const { email, optIns }: { email: string; optIns: string[] } = data // if by POST data
  // const { email } = req.routeParams // if by path

  //
  // HELPERS
  //
  const verifyOptIns = async (
    optIns?: string[],
  ): Promise<{
    invalidOptInsInput: string[] | undefined
    verifiedOptInIDs: string[] | undefined
  }> => {
    if (optIns) {
      //
      // Get all matching OptInChannels
      const optInChannelResults = await req.payload.find({
        collection: OptInChannels.slug as CollectionSlug,
        where: {
          id: { in: optIns },
        },
      })
      const verifiedOptInIDs: string[] | undefined = optInChannelResults.docs.map(
        (channel) => channel.id,
      )

      //
      // Separate all non-matching OptInChannels
      const checkInvalidOptInsInput: string[] | undefined = optIns?.filter(
        (channelID) => !verifiedOptInIDs.includes(channelID),
      )
      const invalidOptInsInput: string[] | undefined =
        checkInvalidOptInsInput.length > 0 ? checkInvalidOptInsInput : undefined

      // req.payload.logger.info(`optIns = ${JSON.stringify(optIns)}`)
      // req.payload.logger.info(`invalidOptInsInput = ${JSON.stringify(invalidOptInsInput)}`)
      // req.payload.logger.info(`verifiedOptInIDs = ${JSON.stringify(verifiedOptInIDs)}`)
      return { invalidOptInsInput, verifiedOptInIDs }
    }
    return { invalidOptInsInput: undefined, verifiedOptInIDs: undefined }
  }
  const getTokenAndHash = (milliseconds?: number) => {
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = milliseconds ? new Date(Date.now() + milliseconds) : undefined

    return { expiresAt, token, tokenHash }
  }
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
      collection: 'subscribers',
      data: {
        email,
        optIns,
        // @ts-expect-error - yeah, set the password
        password,
        status,
        verificationToken,
        verificationTokenExpires: verificationTokenExpires?.toISOString(),
      },
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
      collection: 'subscribers',
      data: {
        optIns,
        // @ts-expect-error - yeah, set the password
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
    linkTet,
    message,
    optIns,
    subject,
    token,
  }: {
    email: string
    linkTet: string
    message: string
    optIns?: string[]
    subject: string
    token: string
  }) => {
    const magicLink = `${req.payload.config.serverURL}/verify?token=${token}&email=${email}&optIns=${optIns.join(',')}`
    const text = message + `<a href="${magicLink}">${linkTet}</a>`
    const emailResult = await req.payload.sendEmail({
      subject,
      text,
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
    return Response.json(
      { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse,
      { status: 400 },
    )
  }

  //
  // Validate OptInChannels
  const { invalidOptInsInput, verifiedOptInIDs } = await verifyOptIns(optIns)

  if (invalidOptInsInput) {
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
    collection: 'subscribers',
    where: {
      email: { equals: email },
    },
  })
  const subscriber = userResults.docs[0]

  //
  // Now we have a subscriber and validatedOptIns
  // Handle scenarios
  //
  // ********************************************************
  //
  if (req.user && req.user.email != email) {
    //
    // Error: Auth-ed user doesn't match subscriber email
    //
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
      linkTet: 'Verify',
      message: data.message || `<h1>Click here to verify your subscription:</h1>`,
      optIns: verifiedOptInIDs,
      subject: data.subject || 'Please verify your subscription',
      token,
    })
    if (!emailResult) {
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
      return Response.json(
        { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
        { status: 400 },
      )
    }

    //
    // Send email
    const emailResult = await sendVerifyEmail({
      email,
      linkTet: 'Verify',
      message: data.message || `<h1>Click here to verify your subscription:</h1>`,
      optIns: verifiedOptInIDs,
      subject: data.subject || 'Please verify your subscription',
      token,
    })
    if (!emailResult) {
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
      return Response.json(
        { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
        { status: 400 },
      )
    }

    const emailResult = await sendVerifyEmail({
      email,
      linkTet: 'Verify',
      message: data.message || `<h1>Click here to verify your email:</h1>`,
      optIns: verifiedOptInIDs,
      subject: data.subject || 'Please verify your subscription',
      token,
    })
    if (!emailResult) {
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
    const updateResults = await updateSubscriber({
      id: subscriber.id,
      optIns: verifiedOptInIDs,
      password: tokenHash,
      status: 'subscribed',
      verificationToken: '',
      verificationTokenExpires: null,
    })

    // Return results, including the verified optIns
    return Response.json({
      // @ts-expect-error False error with Payload result type
      email: updateResults.email,
      now: new Date().toISOString(),
      // @ts-expect-error False error with Payload result type
      optIns: updateResults.optIns,
    } as SubscribeResponse)
  }
  //
  // Uncaught case
  //
  return Response.json(
    { error: 'Unknown error', now: new Date().toISOString() } as SubscribeResponse,
    { status: 400 },
  )
}

/**
 * subscribe Endpoint Config
 */
const subscribeEndpoint: Endpoint = {
  handler: subscribeHandler,
  method: 'post',
  //   path: '/:id/emailToken',
  path: '/subscribe',
}

export default subscribeEndpoint
