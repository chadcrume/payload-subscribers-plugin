import type { Endpoint, PayloadHandler } from 'payload'

import crypto from 'crypto'

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
 * requestMagicLink Endpoint Handler
 * @param req
 * @data { email }
 * @returns { status: 200, json: {message: string, now: date} }
 * @returns { status: 400, json: {error: ('Bad data' | 'Unknown email result'), now: date} }
 */
export const requestMagicLinkHandler: PayloadHandler = async (req) => {
  const data = req?.json ? await req.json() : {}
  const { email, forwardUrl } = data // if by POST data
  // const { email } = req.routeParams // if by path

  if (!email) {
    return Response.json(
      { error: 'Bad data', now: new Date().toISOString() } as RequestMagicLinkResponse,
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
      { error: 'Bad data', now: new Date().toISOString() } as RequestMagicLinkResponse,
      { status: 400 },
    )
  }
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

  // Update user
  await req.payload.update({
    collection: 'subscribers',
    data: {
      verificationToken: tokenHash,
      verificationTokenExpires: expiresAt.toISOString(),
    },
    where: {
      email: { equals: user.email },
    },
  })

  // Send email
  const forwardUrlParam = forwardUrl ? `&forwardUrl=${encodeURI(forwardUrl)}` : ''
  const magicLink = `${req.payload.config.serverURL}/verify?token=${token}&email=${email}${forwardUrlParam}`
  const subject = data.subject || 'Your Magic Login Link'
  const message = data.message || `<h1>Click here to login:</h1><a href="${magicLink}">Login</a>`
  const emailResult = await req.payload.sendEmail({
    subject,
    text: message,
    to: user.email,
  })
  //   req.payload.logger.info(`email result: ${JSON.stringify(emailResult)}`)
  // return data; // Return data to allow normal submission if needed
  if (!emailResult) {
    return Response.json(
      { error: 'Unknown email result', now: new Date().toISOString() } as RequestMagicLinkResponse,
      { status: 400 },
    )
  }
  req.payload.logger.info(`requestMagicLinkHandler email sent \n ${magicLink}`)
  return Response.json({ emailResult, now: new Date().toISOString() } as RequestMagicLinkResponse)
}

/**
 * requestMagicLink Endpoint Config
 */
const requestMagicLinkEndpoint: Endpoint = {
  handler: requestMagicLinkHandler,
  method: 'post',
  path: '/emailToken',
}

export default requestMagicLinkEndpoint
