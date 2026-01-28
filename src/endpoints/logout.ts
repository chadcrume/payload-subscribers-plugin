import type { Endpoint, PayloadHandler } from 'payload'

import { getServerUrl } from '@server-functions/serverUrl.js'

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
    const logoutResult = await fetch(
      `${req.payload.config.serverURL}/api/${'subscribers'}/logout`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    const logoutResultData = await logoutResult.json()

    if (logoutResult.ok) {
      return Response.json({
        message: logoutResultData.message,
        now: new Date().toISOString(),
      } as LogoutResponse)
    }

    if (
      logoutResult.status == 400 &&
      logoutResultData.errors?.map((e: { message: string }) => e.message).includes('No User')
    ) {
      return Response.json(
        {
          error: `Logout failed: 'No User'`,
          now: new Date().toISOString(),
        } as LogoutResponse,
        {
          status: 400,
        },
      )
    }
    return Response.json(
      {
        error: `Logout failed: ${
          logoutResultData.errors
            ? logoutResultData.errors?.map((e: { message: string }) => e.message).join(' // ')
            : JSON.stringify(logoutResultData)
        }`,
        now: new Date().toISOString(),
      } as LogoutResponse,
      {
        status: 400,
      },
    )
  } catch (error) {
    // throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return Response.json(
      {
        error: `Logout failed: ${JSON.stringify(error)}`,
        now: new Date().toISOString(),
      } as LogoutResponse,
      {
        status: 400,
      },
    )
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
