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

  if (!email) {
    return Response.json(
      { error: 'Bad data', now: new Date().toISOString() } as SubscribeResponse,
      { status: 400 },
    )
  }

  const userResults = await req.payload.find({
    collection: 'subscribers',
    where: {
      email: { equals: email },
    },
  })
  const user = userResults.docs[0]

  if (user) {
    // IF USER PENDING...
    console.log('subscribeHandler optIns', optIns)

    //
    // Handle OptInChannels
    if (optIns) {
      //
      // Get all matching OptInChannels
      const optInChannelResults = await req.payload.find({
        collection: OptInChannels.slug as CollectionSlug,
        where: {
          id: { in: optIns },
        },
      })
      const verifiedOptInIDs = optInChannelResults.docs.map((channel) => channel.id)
      //
      // Error if any invalid optIns
      const invalidOptInsInput: boolean =
        optIns.filter((channelID) => !verifiedOptInIDs.includes(channelID)).length > 0

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
      // Now we have user and validated useOptIns
      // Subscribe the user to any useOptIns
      //
      // Update user with EXACTLY verifiedOptInIDs
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      // Create user with token for pending email
      const updateResults = await req.payload.update({
        id: user.id,
        collection: 'subscribers',
        data: {
          optIns: verifiedOptInIDs,
          // @ts-expect-error - yeah, set the password
          password: tokenHash,
          status: 'subscribed',
          verificationToken: '',
          verificationTokenExpires: null,
        },
      })
      console.log('updateResults', updateResults)

      // updateResults
      return Response.json({
        email: user.email,
        now: new Date().toISOString(),
        optIns: verifiedOptInIDs,
      } as SubscribeResponse)
    } else {
      return Response.json(
        { error: 'Already subscribed', now: new Date().toISOString() } as SubscribeResponse,
        { status: 400 },
      )
    }
  } else {
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    // Create user with token for pending email
    await req.payload.create({
      collection: 'subscribers',
      data: {
        email,
        optIns,
        // @ts-expect-error - yeah, set the password
        password: tokenHash,
        status: 'pending',
        verificationToken: tokenHash,
        verificationTokenExpires: expiresAt.toISOString(),
      },
    })

    // Send email
    const magicLink = `${req.payload.config.serverURL}/verify?token=${token}&email=${email}`
    const subject = data.subject || 'Please verify your subscription'
    const message =
      data.message ||
      `<h1>Click here to verify you're subscription:</h1><a href="${magicLink}">Login</a>`
    const emailResult = await req.payload.sendEmail({
      subject,
      text: message,
      to: email,
    })
    if (!emailResult) {
      return Response.json(
        { error: 'Unknown email result', now: new Date().toISOString() } as SubscribeResponse,
        { status: 400 },
      )
    }
    return Response.json({ emailResult, now: new Date().toISOString() } as SubscribeResponse)
  }
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
