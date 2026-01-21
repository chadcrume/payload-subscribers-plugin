import type { OptInChannel } from '@payload-types'
import type { CollectionSlug, Endpoint, PayloadHandler } from 'payload'

import { OptInChannels as OptInChannelCollection } from '@collections/OptInChannels.js'

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
 *
 * @returns
 */
export const getOptInChannelsHandler: PayloadHandler = async (req) => {
  const findResults = await req.payload.find({
    collection: OptInChannelCollection.slug as CollectionSlug,
    depth: 2,
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
 * getOptInChannels Endpoint Config
 */
const getOptInChannelsEndpoint: Endpoint = {
  handler: getOptInChannelsHandler,
  method: 'get',
  path: '/optinchannels',
}

export default getOptInChannelsEndpoint
