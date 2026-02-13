import type { BasePayload, CollectionSlug, Config } from 'payload'

import { OptedInChannels } from './collections/fields/OptedInChannels.js'
import OptInChannels from './collections/OptInChannels.js'
import {
  defaultTokenExpiration,
  SubscribersCollectionFactory,
  subscribersCollectionFields,
} from './collections/Subscribers.js'
import getOptInChannelsEndpoint from './endpoints/getOptInChannels.js'
import createEndpointLogout from './endpoints/logout.js'
import createEndpointRequestMagicLink from './endpoints/requestMagicLink.js'
import createEndpointSubscribe from './endpoints/subscribe.js'
import createEndpointSubscriberAuth from './endpoints/subscriberAuth.js'
import createEndpointUnsubscribe from './endpoints/unsubscribe.js'
import createEndpointVerifyMagicLink from './endpoints/verifyMagicLink.js'
import { getTestEmail } from './helpers/testData.js'
import { getTokenAndHash } from './helpers/token.js'
import { isAbsoluteURL } from './helpers/utilities.js'

export type PayloadSubscribersConfig = {
  /**
   * List of collections to add a custom field
   */
  collections?: Partial<Record<CollectionSlug, true>>
  /**
   * Defaults to false-y. When true:
   *  - Database schema changes are still made and seeded
   *  - APIs return null or undefined success
   *  - Admin components are not added
   *  - App components return nothing
   */
  disabled?: boolean
  /**
   * The collection to use as the subscribers collection
   * - Optional. If not specified, the plugin will add a 'subscribers' collection.
   * - Sets the collection auth if not already.
   * - Adds (or overrides) fields: email, firstName, status, optIns, verificationToken, verificationTokenExpires.
   */
  subscribersCollectionSlug?: CollectionSlug
  /**
   * Defaults to 30 minutes
   */
  tokenExpiration?: number
  /**
   * The route or full URL for unsubscribe links
   */
  unsubscribeUrl?: string
  /**
   * The route or full URL for verify links
   */
  verifyUrl?: string
}

export const payloadSubscribersPlugin =
  (pluginOptions: PayloadSubscribersConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    config.collections.push(OptInChannels)

    const unsubscribeUrl = !pluginOptions.unsubscribeUrl
      ? undefined
      : isAbsoluteURL(pluginOptions.unsubscribeUrl)
        ? new URL(pluginOptions.unsubscribeUrl)
        : config.serverURL
          ? new URL(pluginOptions.unsubscribeUrl, config.serverURL)
          : undefined

    // Get a URL object from the verifyUrl option
    const verifyUrl = !pluginOptions.verifyUrl
      ? undefined
      : isAbsoluteURL(pluginOptions.verifyUrl)
        ? new URL(pluginOptions.verifyUrl)
        : config.serverURL
          ? new URL(pluginOptions.verifyUrl, config.serverURL)
          : undefined

    let subscribersCollection = pluginOptions.subscribersCollectionSlug
      ? config.collections.find(
          (collection) => collection.slug == pluginOptions.subscribersCollectionSlug,
        )
      : undefined

    if (subscribersCollection) {
      // Configure the input collection to be the subscribers collection
      config.collections = config.collections.filter(
        (collection) => collection.slug != subscribersCollection?.slug,
      )
      subscribersCollection.fields.push(...subscribersCollectionFields)
      if (!subscribersCollection.auth) {
        subscribersCollection = {
          ...subscribersCollection,
          auth: { tokenExpiration: defaultTokenExpiration },
        }
      }
      if (!subscribersCollection.admin?.useAsTitle) {
        if (!subscribersCollection.admin) {
          subscribersCollection.admin = { useAsTitle: 'email' }
        } else {
          // Throw error? Or override?
          subscribersCollection.admin.useAsTitle = 'email'
        }
      }
      config.collections.push(subscribersCollection)
    } else {
      // Configure the default built-in subscribers collection
      subscribersCollection = SubscribersCollectionFactory({
        slug: pluginOptions.subscribersCollectionSlug,
        tokenExpiration: pluginOptions.tokenExpiration,
      })
      config.collections.push(subscribersCollection)
    }

    if (pluginOptions.collections) {
      for (const collectionSlug in pluginOptions.collections) {
        const collection = config.collections.find(
          (collection) => collection.slug === collectionSlug,
        )

        if (collection) {
          collection.fields.push(OptedInChannels)
        }
      }
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    config.endpoints.push(
      getOptInChannelsEndpoint,
      createEndpointLogout({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
      createEndpointRequestMagicLink({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
        unsubscribeUrl,
      }),
      createEndpointSubscribe({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
      createEndpointSubscriberAuth({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
      createEndpointUnsubscribe({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
      createEndpointVerifyMagicLink({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
    )

    const incomingOnInit = config.onInit

    const genInit = (testData: { testEmail: string }) => async (payload: BasePayload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }

      // console.log('Object.keys(payload.collections)', Object.keys(payload.collections))
      const { totalDocs: totalOptIns } = await payload.count({
        collection: 'opt-in-channels',
        where: {
          title: {
            equals: 'seeded-by-plugin',
          },
        },
      })

      if (totalOptIns === 0) {
        await payload.create({
          collection: 'opt-in-channels',
          data: {
            active: true,
            title: 'seeded-by-plugin',
          },
        })
      }

      // const { seededChannel } = await payload.find({
      //   collection: 'opt-in-channels',
      //   where: {
      //     title: {
      //       equals: 'seeded-by-plugin',
      //     },
      //   },
      // })

      const { totalDocs: totalSubscribers } = await payload.count({
        collection: subscribersCollection.slug as CollectionSlug,
        where: {
          email: {
            equals: testData.testEmail,
          },
        },
      })

      const { tokenHash } = getTokenAndHash() // Unknowable
      // payload.logger.info(`testData.testEmail == '${testData.testEmail}'`)
      if (totalSubscribers === 0) {
        await payload.create({
          collection: subscribersCollection.slug as CollectionSlug,
          data: {
            email: testData.testEmail,
            password: tokenHash,
            status: 'pending',
          },
        })
      }
    }

    // console.log(`getTestEmail == '${getTestEmail()}'`)
    config.onInit = genInit({ testEmail: getTestEmail() })

    return config
  }
