import type { CollectionSlug } from 'payload'

import { customSubscribersCollectionsSlug } from '@helpers/credentials.js'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import { getServerUrl } from '../src/server-functions/serverUrl.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadSubscribersPlugin } from 'payload-subscribers-plugin'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { seed } from './seed.js'

const { serverURL } = await getServerUrl()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'posts',
        fields: [],
      },
      {
        slug: 'media',
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
      {
        slug: 'users',
        auth: true,
        fields: [],
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      url: process.env.DATABASE_URL || '',
    }),
    // editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      payloadSubscribersPlugin({
        collections: {
          posts: true,
        },
        disabled: false,
        subscribersCollectionSlug: customSubscribersCollectionsSlug,
        unsubscribeURL: '/unsubscribe',
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    serverURL,
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
