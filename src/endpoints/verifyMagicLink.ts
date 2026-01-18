import type { Endpoint, PayloadHandler } from 'payload'

import crypto from 'crypto'

/**
 * verifyMagicLink Endpoint Handler
 * @param req
 * @data { email }
 * @returns { status: 200, json: {message: string} }
 * @returns { status: 400, json: {error: string} }
 */
export const verifyMagicLinkHandler: PayloadHandler = async (req) => {
  const data = req?.json ? await req.json() : {}
  const { email, token } = data // if by POST data
  // const { email, token } = req.routeParams // if by path

  if (!email || !token) {
    return Response.json({ error: 'Bad data' }, { status: 400 })
  }

  const userResults = await req.payload.find({
    collection: 'subscribers',
    where: {
      email: { equals: email },
    },
  })
  const user = userResults.docs[0]

  if (!user) {
    return Response.json({ error: 'Bad data' }, { status: 400 })
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  if (tokenHash != user.verificationToken) {
    // req.payload.logger.info(`Token not verified: ${tokenHash} != ${user.verificationToken}`)
    return Response.json({ error: 'Token not verified' }, { status: 400 })
  }

  if (Date.now() > user.verificationTokenExpires) {
    return Response.json({ error: 'Token expired' }, { status: 400 })
  }

  // Update user
  await req.payload.update({
    collection: 'subscribers',
    data: {
      verificationToken: '',
      verificationTokenExpires: null,
    },
    where: {
      email: { equals: user.email },
    },
  })

  return Response.json({ message: 'Token verified' })
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
