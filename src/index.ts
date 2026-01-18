import type { BasePayload, CollectionSlug, Config } from 'payload'

import { OptedInChannels } from './collections/fields/OptedInChannels.js'
import OptInChannels from './collections/OptInChannels.js'
import Subscribers from './collections/Subscribers.js'
import requestMagicLinkEndpoint from './endpoints/requestMagicLink.js'
import verifyMagicLinkEndpoint from './endpoints/verifyMagicLink.js'
import { getTestEmail } from './helpers/testData.js'

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
}

export const payloadSubscribersPlugin =
  (pluginOptions: PayloadSubscribersConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    config.collections.push(OptInChannels, Subscribers)

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

    config.admin.components.beforeDashboard.push(
      `payload-subscribers-plugin/client#BeforeDashboardClient`,
    )
    config.admin.components.beforeDashboard.push(
      `payload-subscribers-plugin/rsc#BeforeDashboardServer`,
    )

    if (!config.endpoints) {
      config.endpoints = []
    }

    config.endpoints.push(requestMagicLinkEndpoint, verifyMagicLinkEndpoint)

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
        collection: 'subscribers',
        where: {
          email: {
            equals: testData.testEmail,
          },
        },
      })

      // payload.logger.info(`testData.testEmail == '${testData.testEmail}'`)
      if (totalSubscribers === 0) {
        await payload.create({
          collection: 'subscribers',
          data: {
            email: testData.testEmail,
          },
        })
      }
    }

    // console.log(`getTestEmail == '${getTestEmail()}'`)
    config.onInit = genInit({ testEmail: getTestEmail() })

    return config
  }
