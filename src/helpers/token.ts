import crypto from 'crypto'

const SECRET_KEY = process.env.SUBSCRIBERS_SECRET || 'your-very-secure-secret'

export const getTokenAndHash = (milliseconds?: number) => {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto
    .createHash('sha256')
    .update(SECRET_KEY + token)
    .digest('hex')
  const expiresAt = milliseconds ? new Date(Date.now() + milliseconds) : undefined

  return { expiresAt, token, tokenHash }
}

export const getHash = (token: string) => {
  const tokenHash = crypto
    .createHash('sha256')
    .update(SECRET_KEY + token)
    .digest('hex')
  return { token, tokenHash }
}

export const getHmacHash = (content: string): { hashToken: string } => {
  // Create HMAC-SHA256 hash
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(`${content}`)
  const hashToken = hmac.digest('hex')

  return { hashToken }
}
