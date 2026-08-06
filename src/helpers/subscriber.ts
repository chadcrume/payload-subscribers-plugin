import type { CollectionSlug, PayloadRequest, TypedUser } from 'payload'

import { getTokenAndHash } from './token.js'

/**
 * Finds a subscriber by email, creating a pending one (with an invisible, unknowable password) if
 * none exists yet. Shared by the request-magic-link and request-code endpoints, which both need a
 * subscriber doc to exist before they can write a verification secret to it.
 *
 * @param options - Lookup/create options
 * @param options.email - Email of the subscriber to find or create
 * @param options.req - Payload request (used for payload API access)
 * @param options.subscribersCollectionSlug - Collection slug for subscribers
 * @returns The existing or newly created subscriber, or undefined if creation failed
 */
export async function findOrCreatePendingSubscriber({
  email,
  req,
  subscribersCollectionSlug,
}: {
  email: string
  req: PayloadRequest
  subscribersCollectionSlug: CollectionSlug
}): Promise<TypedUser | undefined> {
  const userResults = await req.payload.find({
    collection: subscribersCollectionSlug,
    where: {
      email: { equals: email },
    },
  })
  const user = userResults.docs[0] as TypedUser

  if (user) {
    return user
  }

  //
  // Create subscriber with status 'pending',
  // and an invisible unknowable password,
  //
  const { tokenHash: tokenHash2 } = getTokenAndHash() // Unknowable
  const createResult = await req.payload.create({
    collection: subscribersCollectionSlug,
    data: {
      email,
      password: tokenHash2,
      status: 'pending',
    },
    draft: false,
  })

  return createResult as TypedUser | undefined
}
