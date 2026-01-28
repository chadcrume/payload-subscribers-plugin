import type { Endpoint, PayloadHandler } from 'payload'

import { logout as payloadNextLogout } from '@payloadcms/next/auth'

export type LogoutResponse =
  | {
      error: string
      now: string
    }
  | {
      message: string
      now: string
    }

export const logoutHandler: PayloadHandler = async (req) => {
  try {
    const logoutResult = await payloadNextLogout({ allSessions: true, config: req.payload.config })
    if (logoutResult.success) {
      return Response.json({
        message: logoutResult.message,
        now: new Date().toISOString(),
      } as LogoutResponse)
    }
    return Response.json(
      {
        error: `Logout failed: ${logoutResult.message}`,
        now: new Date().toISOString(),
      } as LogoutResponse,
      {
        status: 400,
      },
    )
  } catch (error) {
    throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * logout Endpoint Config
 */
const logoutEndpoint: Endpoint = {
  handler: logoutHandler,
  method: 'post',
  path: '/logout',
}

export default logoutEndpoint
