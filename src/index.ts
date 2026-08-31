import type { BasePayload, CollectionSlug, Config, Plugin } from 'payload'

import { OptedInChannels } from './collections/fields/OptedInChannels.js'
import OptInChannels from './collections/OptInChannels.js'
import {
  defaultTokenExpiration,
  SubscribersCollectionFactory,
  subscribersAdminGroup,
  subscribersCollectionFields,
} from './collections/Subscribers.js'
import getOptInChannelsEndpoint from './endpoints/getOptInChannels.js'
import createEndpointLogout from './endpoints/logout.js'
import createEndpointRequestCode from './endpoints/requestCode.js'
import createEndpointRequestMagicLink from './endpoints/requestMagicLink.js'
import createEndpointSubscribe from './endpoints/subscribe.js'
import createEndpointSubscriberAuth from './endpoints/subscriberAuth.js'
import createEndpointUnsubscribe from './endpoints/unsubscribe.js'
import createEndpointVerifyCode from './endpoints/verifyCode.js'
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
  unsubscribeURL?: string
  /**
   * The route or full URL for a link included in login-code emails, letting the subscriber
   * click through to a page pre-filled with their email so they only have to type the code.
   * Optional — if omitted (and config.serverURL is also unset), the code email has no link,
   * just the code. Defaults to serverURL+'/verify-code' when config.serverURL is set.
   */
  verifyCodeURL?: string
  /**
   * The route or full URL for verify links
   */
  verifyURL?: string
}

/**
 * Adds the payload-subscribers-plugin to your payload config
 *
 * @param pluginOptions - Plugin options
 * @param pluginOptions.collections - (optional) An array of existing collection slugs to add an optIns relationship field to
 * @param pluginOptions.disabled - (optional) A convenience option to disable the plugin
 * @param pluginOptions.subscribersCollectionSlug - (optional) The slug of an existing collection to use for subscribers. If omitted, the plugin will create the 'subscribers' collection
 * @param pluginOptions.tokenExpiration - (optional) The expiration time for a token, in milliseconds. Defaults to 30 minutes
 * @param pluginOptions.unsubscribeURL - (optional) The route or full URL for unsubscribe links
 * @param pluginOptions.verifyCodeURL - (optional) The route or full URL for a link included in login-code emails
 * @param pluginOptions.verifyURL - (optional) The route or full URL for verify links
 * @returns Payload config modified to include the plugin
 */
export const payloadSubscribersPlugin =
  (pluginOptions: PayloadSubscribersConfig): Plugin =>
  (config: Config): Config => {
    if (!config.serverURL && !(pluginOptions.unsubscribeURL && pluginOptions.verifyURL)) {
      throw new Error(
        'payloadSubscribersPlugin requires config.serverURL OR valid values for all URL options: unsubscribeURL, verifyURL',
      )
    }

    if (!config.collections) {
      config.collections = []
    }

    config.collections.push(OptInChannels)

    const unsubscribeURL = !pluginOptions.unsubscribeURL
      ? new URL('/unsubscribe', config.serverURL)
      : isAbsoluteURL(pluginOptions.unsubscribeURL)
        ? new URL(pluginOptions.unsubscribeURL)
        : new URL(pluginOptions.unsubscribeURL, config.serverURL)

    // Get a URL object from the verifyURL option
    const verifyURL = !pluginOptions.verifyURL
      ? new URL('/verify', config.serverURL)
      : isAbsoluteURL(pluginOptions.verifyURL)
        ? new URL(pluginOptions.verifyURL)
        : new URL(pluginOptions.verifyURL, config.serverURL)

    // Get a URL object from the verifyCodeURL option. Unlike verifyURL, this is fully optional:
    // a relative verifyCodeURL with no config.serverURL can't be resolved, so it's left undefined
    // rather than throwing — the code email just won't include a link in that case.
    const verifyCodeURL = !pluginOptions.verifyCodeURL
      ? config.serverURL
        ? new URL('/verify-code', config.serverURL)
        : undefined
      : isAbsoluteURL(pluginOptions.verifyCodeURL)
        ? new URL(pluginOptions.verifyCodeURL)
        : config.serverURL
          ? new URL(pluginOptions.verifyCodeURL, config.serverURL)
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
      if (!subscribersCollection.admin.group) {
        subscribersCollection.admin.group = subscribersAdminGroup
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
      createEndpointRequestCode({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
        unsubscribeURL,
        verifyCodeURL,
      }),
      createEndpointRequestMagicLink({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
        unsubscribeURL,
        verifyURL,
      }),
      createEndpointSubscribe({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
        unsubscribeURL,
        verifyURL,
      }),
      createEndpointSubscriberAuth({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
      createEndpointUnsubscribe({
        subscribersCollectionSlug: subscribersCollection.slug as CollectionSlug,
      }),
      createEndpointVerifyCode({
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
      })

      if (totalOptIns === 0) {
        await payload.create({
          collection: 'opt-in-channels',
          data: {
            active: false,
            title: 'seeded-by-plugin',
          },
        })
      }

      const { totalDocs: totalSubscribers } = await payload.count({
        collection: subscribersCollection.slug as CollectionSlug,
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
