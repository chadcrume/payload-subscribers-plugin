import type { Endpoint, PayloadHandler } from 'payload'

import { getHash } from '@helpers/token.js'
import { verifyOptIns } from '@helpers/verifyOptIns.js'

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
 * verifyMagicLink Endpoint Handler
 * @param req
 * @data { email, token }
 * @returns { status: 200, json: {message: string, now: date} }
 * @returns { status: 400, json: {error: ('Bad data' | 'Token not verified' | 'Token expired'), now: date} }
 */
export const verifyMagicLinkHandler: PayloadHandler = async (req) => {
  const reqData = req?.json ? await req.json() : {}
  const { email, optIns, token }: { email: string; optIns: string[]; token: string } = reqData // if by POST reqData
  // const { email, token } = req.routeParams // if by path

  if (!email || !token) {
    return Response.json(
      { error: 'Bad data', now: new Date().toISOString() } as VerifyMagicLinkResponse,
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
    collection: 'subscribers',
    data: {
      // @ts-expect-error - yeah, set the password
      password: tokenHash,
    },
    where: {
      email: { equals: user.email },
    },
  })

  // Log the user in via Payload headers
  let headers
  try {
    const loginReq = await fetch(`${req.payload.config.serverURL}/api/${'subscribers'}/login`, {
      body: JSON.stringify({
        email,
        password: tokenHash,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    if (loginReq && loginReq.ok) {
      headers = loginReq.headers
    }
  } catch (error) {
    // console.log(error)
    return Response.json({ error } as VerifyMagicLinkResponse, { status: 400 })
  }
  // console.log('login', headers)

  //
  // Handle OptInChannels
  const { invalidOptInsInput, verifiedOptInIDs } = await verifyOptIns(req.payload, optIns)
  if (invalidOptInsInput) {
    return Response.json(
      {
        error: 'Invalid input: ' + JSON.stringify(optIns),
        now: new Date().toISOString(),
      } as VerifyMagicLinkResponse,
      { status: 400 },
    )
  }

  const data = {
    optIns: optIns ? verifiedOptInIDs : undefined,
    password: 'something super secret',
    status: 'subscribed' as 'pending' | 'subscribed' | 'unsubscribed' | undefined,
    verificationToken: '',
    verificationTokenExpires: null,
  }
  // Update user
  await req.payload.update({
    collection: 'subscribers',
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

/**
 * verifyMagicLink Endpoint Config
 */
const verifyMagicLinkEndpoint: Endpoint = {
  handler: verifyMagicLinkHandler,
  method: 'post',
  path: '/verifyToken',
}

export default verifyMagicLinkEndpoint
