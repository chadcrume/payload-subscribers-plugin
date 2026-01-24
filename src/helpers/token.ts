import crypto from 'crypto'

export const getTokenAndHash = (milliseconds?: number) => {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = milliseconds ? new Date(Date.now() + milliseconds) : undefined

  return { expiresAt, token, tokenHash }
}

export const getHash = (token: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  return { token, tokenHash }
}
