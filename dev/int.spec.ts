import type { Payload } from 'payload'

import config from '@payload-config'
import { createPayloadRequest, getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import requestMagicLinkEndpoint from '../src/endpoints/requestMagicLink.js'

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
  let optInID: any

  test('Plugin creates and seeds opt-in-channels', async () => {
    expect(payload.collections['opt-in-channels']).toBeDefined()

    const { docs } = await payload.find({ collection: 'opt-in-channels' })

    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('seeded-by-plugin')
    optInID = docs[0].id
  })

  test('Plugin creates and seeds subscribers', async () => {
    expect(payload.collections['subscribers']).toBeDefined()

    const { docs } = await payload.find({ collection: 'subscribers' })

    expect(docs).toHaveLength(1)
    expect(docs[0]).toBeDefined()
    // expect(docs[0].optIns).toBeDefined()
    // expect(docs[0].optIns).toHaveLength(1)

    // expect(docs[0].optIns[0].email).toBe('seeded-by-plugin@crume.org')
  })

  test('Can create post with custom text field added by plugin', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        optIns: [optInID],
      },
    })

    expect(post.optIns).toStrictEqual([optInID])
  })

  test('Can use requestMagicLinkEndpoint endpoint', async () => {
    payload.logger.info(`payload.config.serverURL: ${payload.config.serverURL}`)
    // const result = await fetch(payload.config.serverURL + '/emailToken', {
    //   body: JSON.stringify({ email: 'seeded-by-plugin@crume.org' }),
    //   method: 'post',
    // })
    // expect(result.ok).toStrictEqual(true)
    // const resJson = await result.json()
    // expect(resJson.message).toStrictEqual('token link emailed')

    const request = new Request('http://localhost:3000/api/my-plugin-endpoint', {
      body: JSON.stringify({ email: 'seeded-by-plugin@crume.org' }),
      method: 'POST',
    })
    const payloadRequest = await createPayloadRequest({ config, request })

    const response = await requestMagicLinkEndpoint.handler(payloadRequest)

    expect(response.status).toBe(200)

    expect(await response.json()).toStrictEqual({
      message: "Test email to: 'seeded-by-plugin@crume.org', Subject: 'Your Magic Login Link'",
    })
  })
})
