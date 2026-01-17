import type { Payload } from 'payload'

import config from '@payload-config'
import { createPayloadRequest, getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { customEndpointHandler } from '../src/endpoints/customEndpointHandler.js'

let payload: Payload

afterAll(async () => {
  // await payload.destroy()
  // console.log('\n', 'afterAll payload.db', payload.db.url, '\n')
  if (payload.db.connection) {
    // console.log('\n', 'afterAll payload.db.connection.close', true, '\n')
    await payload.db.connection.close()
  }
})

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('Plugin integration tests', () => {
  test('should query custom endpoint added by plugin', async () => {
    const request = new Request('http://localhost:3000/api/my-plugin-endpoint', {
      method: 'GET',
    })

    const payloadRequest = await createPayloadRequest({ config, request })
    const response = await customEndpointHandler(payloadRequest)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toMatchObject({
      message: 'Hello from custom endpoint',
    })
  })

  let optInID: any

  test('plugin creates and seeds opt-in-channels', async () => {
    expect(payload.collections['opt-in-channels']).toBeDefined()

    const { docs } = await payload.find({ collection: 'opt-in-channels' })

    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('seeded-by-plugin')
    optInID = docs[0].id
  })

  test('plugin creates and seeds subscribers', async () => {
    expect(payload.collections['subscribers']).toBeDefined()

    const { docs } = await payload.find({ collection: 'subscribers' })

    expect(docs).toHaveLength(1)
    expect(docs[0]).toBeDefined()
    // expect(docs[0].optIns).toBeDefined()
    // expect(docs[0].optIns).toHaveLength(1)

    // expect(docs[0].optIns[0].email).toBe('seeded-by-plugin@crume.org')
  })

  test('can create post with custom text field added by plugin', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        optIns: [optInID],
      },
    })
    // console.log('\n', 'post.optIns', post.optIns, '\n')
    expect(post.optIns).toStrictEqual([optInID])

    // const posts = await payload.find({
    //   collection: 'posts',
    // })
    // console.log('\n', 'posts.docs.length', posts.docs.length, '\n')
    // posts.docs.forEach((post) => {
    //   console.log('\n', 'post[id].addedByPlugin', post.id, ' = ', post.addedByPlugin, '\n')
    // })
  })
})
