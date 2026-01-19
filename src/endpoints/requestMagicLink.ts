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
 * @returns { status: 400, json: {error: string, now: date} }
 */
export const requestMagicLinkHandler: PayloadHandler = async (req) => {
  const data = req?.json ? await req.json() : {}
  const { email } = data // if by POST data
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

  // Update user (or create if not found)
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
  const magicLink = `${req.payload.config.serverURL}/verify?token=${token}&email=${email}`
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
  //   path: '/:id/emailToken',
  path: '/emailToken',
}
//     {
//       path: '/:id/tracking',
//       method: 'get',
//       handler: async (req) => {
//         const tracking = await getTrackingInfo(req.routeParams.id)

//         if (!tracking) {
//           return Response.json({ error: 'not found' }, { status: 404 })
//         }

//         return Response.json({
//           message: `Hello ${req.routeParams.name as string} @ ${req.routeParams.group as string}`,
//         })
//       },
//     },
//     {
//       path: '/:id/tracking',
//       method: 'post',
//       handler: async (req) => {
//         // `data` is not automatically appended to the request
//         // if you would like to read the body of the request
//         // you can use `data = await req.json()`
//         const data = await req.json()
//         await req.payload.update({
//           collection: 'tracking',
//           data: {
//             // data to update the document with
//           },
//         })
//         return Response.json({
//           message: 'successfully updated tracking info',
//         })
//       },
//     },
//     {
//       path: '/:id/forbidden',
//       method: 'post',
//       handler: async (req) => {
//         // this is an example of an authenticated endpoint
//         if (!req.user) {
//           return Response.json({ error: 'forbidden' }, { status: 403 })
//         }

//         // do something

//         return Response.json({
//           message: 'successfully updated tracking info',
//         })
//       },
//     },

export default requestMagicLinkEndpoint
