import type { BasePayload, CollectionSlug } from 'payload'

import OptInChannels from '../collections/OptInChannels.js'

export const verifyOptIns = async (
  payload: BasePayload,
  optIns?: string[],
): Promise<{
  invalidOptInsInput: string[] | undefined
  verifiedOptInIDs: string[] | undefined
}> => {
  if (optIns) {
    //
    // Get all matching OptInChannels
    const optInChannelResults = await payload.find({
      collection: OptInChannels.slug as CollectionSlug,
      where: {
        id: { in: optIns },
      },
    })
    const verifiedOptInIDs: string[] | undefined = optInChannelResults.docs.map(
      (channel) => channel.id,
    )

    //
    // Separate all non-matching OptInChannels
    const checkInvalidOptInsInput: string[] | undefined = optIns?.filter(
      (channelID) => !verifiedOptInIDs.includes(channelID),
    )
    const invalidOptInsInput: string[] | undefined =
      checkInvalidOptInsInput.length > 0 ? checkInvalidOptInsInput : undefined

    // req.payload.logger.info(`optIns = ${JSON.stringify(optIns)}`)
    // req.payload.logger.info(`invalidOptInsInput = ${JSON.stringify(invalidOptInsInput)}`)
    // req.payload.logger.info(`verifiedOptInIDs = ${JSON.stringify(verifiedOptInIDs)}`)
    return { invalidOptInsInput, verifiedOptInIDs }
  }
  return { invalidOptInsInput: undefined, verifiedOptInIDs: undefined }
}
