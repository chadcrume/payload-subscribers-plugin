import type { OptInChannel } from '../copied/payload-types.js'
import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import { OptInChannels as OptInChannelCollection } from '../collections/OptInChannels.js'

export type GetOptInChannelsResponse =
  | {
      error: string
      now: string
    }
  | {
      now: string
      optInChannels: OptInChannel[]
    }

/**
 * Payload handler for GET /optinchannels. Returns all active opt-in channels
 * for subscription preferences.
 *
 * @param req - Payload request object
 * @returns Response with `optInChannels` array on success, or `error` and `now` on failure (400)
 */
export const getOptInChannelsHandler: PayloadHandler = async (req) => {
  const findResults = await req.payload.find({
    collection: OptInChannelCollection.slug as CollectionSlug,
    depth: 2,
    where: {
      active: { equals: true },
    },
  })
  // .catch((error) => {
  //   return Response.json({ error, now: new Date().toISOString() } as GetOptInChannelsResponse, {
  //     status: 400,
  //   })
  // })

  if (!findResults) {
    return Response.json(
      { error: 'Unknown find result', now: new Date().toISOString() } as GetOptInChannelsResponse,
      { status: 400 },
    )
  }

  return Response.json({
    now: new Date().toISOString(),
    optInChannels: findResults.docs,
  } as GetOptInChannelsResponse)
}

/**
 * Endpoint config for listing active opt-in channels. Mount as GET /optinchannels.
 * Used by the subscribe UI to fetch available subscription channels.
 */
const getOptInChannelsEndpoint: Endpoint = {
  handler: getOptInChannelsHandler,
  method: 'get',
  path: '/optinchannels',
}

export default getOptInChannelsEndpoint
