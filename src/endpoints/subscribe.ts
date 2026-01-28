import type { Endpoint, PayloadHandler } from 'payload'

import { getTokenAndHash } from '@helpers/token.js'
import { verifyOptIns } from '@helpers/verifyOptIns.js'

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
 * subscribe Endpoint Handler
 * @param req
 * @data { email }
 * @returns { status: 200, json: {message: string, now: date} }
 * @returns { status: 400, json: {error: ('Bad data' | 'Already subscribed' | 'Unknown email result'), now: date} }
 */
export const subscribeHandler: PayloadHandler = async (req) => {
  const data = req?.json ? await req.json() : {}
  const {
    afterVerifyUrl,
    email,
    optIns,
  }: { afterVerifyUrl: string; email: string; optIns: string[] } = data // if by POST data
  // const { email } = req.routeParams // if by path

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
      collection: 'subscribers',
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
      collection: 'subscribers',
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
    forwardUrl,
    linkTet,
    message,
    subject,
    token,
  }: {
    email: string
    forwardUrl?: string
    linkTet: string
    message: string
    subject: string
    token: string
  }) => {
    const forwardUrlParam = forwardUrl ? `&forwardUrl=${encodeURI(forwardUrl)}` : ''
    const magicLink = `${req.payload.config.serverURL}/verify?token=${token}&email=${email}${forwardUrlParam}`
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
  const { invalidOptInsInput, verifiedOptInIDs } = await verifyOptIns(req.payload, optIns)

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
      forwardUrl: afterVerifyUrl,
      linkTet: 'Verify',
      message: data.message || `<h1>Click here to verify your subscription:</h1>`,
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
      forwardUrl: afterVerifyUrl,
      linkTet: 'Verify',
      message: data.message || `<h1>Click here to verify your subscription:</h1>`,
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
      forwardUrl: afterVerifyUrl,
      linkTet: 'Verify',
      message: data.message || `<h1>Click here to verify your email:</h1>`,
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
      email: updateResults.email,
      now: new Date().toISOString(),
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
  path: '/subscribe',
}

export default subscribeEndpoint
