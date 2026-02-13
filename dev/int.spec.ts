import type { Payload } from 'payload'

import { customSubscribersCollectionsSlug } from '@helpers/credentials.js'
import config from '@payload-config'
import crypto from 'crypto'
import { createPayloadRequest, getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import getOptInChannelsEndpoint from '../src/endpoints/getOptInChannels.js'
import createEndpointLogout from '../src/endpoints/logout.js'
import createEndpointRequestMagicLink from '../src/endpoints/requestMagicLink.js'
import createSubscribeEndpoint from '../src/endpoints/subscribe.js'
import createSubscriberAuthEndpoint from '../src/endpoints/subscriberAuth.js'
import createVerifyMagicLinkEndpoint from '../src/endpoints/verifyMagicLink.js'
import { getTestEmail } from '../src/helpers/testData.js'
import { getHash } from '../src/helpers/token.js'
import { getServerUrl } from '../src/server-functions/serverUrl.js'

const { serverURL } = await getServerUrl()
let payload: Payload

/**
 *
 */
afterAll(async () => {
  // await payload.destroy()
  // console.log('\n', 'afterAll payload.db', payload.db.url, '\n')
  if (payload.db.connection) {
    // console.log('\n', 'afterAll payload.db.connection.close', true, '\n')
    await payload.db.connection.close()
  }
})

/**
 *
 */
beforeAll(async () => {
  payload = await getPayload({ config })
})

/**
 *
 */
describe('Plugin integration tests', () => {
  let optInID: any

  /**
   *
   */
  test('Plugin creates and seeds opt-in-channels', async () => {
    expect(payload.collections['opt-in-channels']).toBeDefined()

    const { docs } = await payload.find({ collection: 'opt-in-channels' })

    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('seeded-by-plugin')
    optInID = docs[0].id
  })

  /**
   *
   */
  test('Plugin creates and seeds subscribers', async () => {
    expect(payload.collections[customSubscribersCollectionsSlug]).toBeDefined()

    const { docs } = await payload.find({ collection: customSubscribersCollectionsSlug })

    expect(docs).toHaveLength(1)
    expect(docs[0]).toBeDefined()
    // expect(docs[0].optIns).toBeDefined()
    // expect(docs[0].optIns).toHaveLength(1)

    // expect(docs[0].optIns[0].email).toBe(testEmail)
  })

  /**
   *
   */
  test('Can create post with custom text field added by plugin', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        optIns: [optInID],
      },
      depth: 0,
    })

    expect(post.optIns).toStrictEqual([optInID])
  })

  /**
   *
   */
  test('Can use getOptInChannelsEndpoint endpoint', async () => {
    // payload.logger.info(`payload.config.serverURL: ${payload.config.serverURL}`)

    const request = new Request(`${serverURL}/api/optinchannels`, {
      method: 'GET',
    })
    const payloadRequest = await createPayloadRequest({ config, request })

    const response = await getOptInChannelsEndpoint.handler(payloadRequest)

    expect(response.status).toBe(200)

    const resJson = await response.json()
    expect(resJson.optInChannels).not.toBeUndefined()
  })

  /**
   *
   */
  test('Can use requestMagicLinkEndpoint endpoint', async () => {
    // payload.logger.info(`payload.config.serverURL: ${payload.config.serverURL}`)

    const testEmail = getTestEmail()

    const request = new Request(`${serverURL}/api/emailToken`, {
      body: JSON.stringify({ email: testEmail }),
      method: 'POST',
    })
    const payloadRequest = await createPayloadRequest({ config, request })

    payload.logger.info(`customSubscribersCollectionsSlug = ${customSubscribersCollectionsSlug}`)
    const response = await createEndpointRequestMagicLink({
      subscribersCollectionSlug: customSubscribersCollectionsSlug,
      verifyUrl: new URL('/verify', serverURL),
    }).handler(payloadRequest)

    payload.logger.info(`called ${serverURL}/api/emailToken`)

    const resJson = await response.json()
    payload.logger.info(`resJson ${JSON.stringify(resJson, undefined, 2)}`)

    expect(response.status).toBe(200)

    expect(resJson.emailResult).toBeDefined()
    //   .toStrictEqual({
    //     message: `Test email to: '${testEmail}', Subject: 'Your Magic Login Link', Html: '
    // <p>You requested a magic link to log in. Click the button below</p>
    // <p><a href=\"/verify&token=3602d6962b80579529eaa6ecb700f04a9e38549137e02075163ebc90c0b42f0e&email=${testEmail}\"><button><b>Login</b></button></a></p>
    // '`,
    //   })
  })

  /**
   *
   */
  // // Can't test this here, relies on nextHeaders which requires a request context
  // // Tried vi.mock as follows, but isn't working
  // vi.mock('next/headers.js', async (importActual) => {
  //   const actual: Headers = await importActual()
  //   return {
  //     ...actual,
  //     // headers: vi.fn(() => new Headers({ 'some-header': 'mock-value' })),
  //   }
  // })

  // test('Can use logoutEndpoint endpoint', async () => {
  //   const logoutRequest = new Request(`${serverURL}/api/logout`, {
  //     body: JSON.stringify({}),
  //     method: 'POST',
  //   })
  //   const logoutPayloadRequest = await createPayloadRequest({ config, request: logoutRequest })

  //   const logoutResponse = await createEndpointLogout({
  //     subscribersCollectionSlug: customSubscribersCollectionsSlug,
  //   }).handler(logoutPayloadRequest)
  //   const logoutResponseData = await logoutResponse.json()

  //   payload.logger.info(`called ${serverURL}/api/logout`)
  //   payload.logger.info(`response status ${logoutResponse.status}`)
  //   payload.logger.info(`response data ${JSON.stringify(logoutResponseData)}`)

  //   expect(logoutResponse.status).toBe(400)
  //   expect(logoutResponseData.error).toStrictEqual("Logout failed: 'No User'")

  //   // expect(logoutResponse.status).toBe(200)
  //   // expect(logoutResponseData.message).toStrictEqual('User logged out successfully')
  // })

  /**
   *
   */
  test('Can use verifyMagicLink endpoint', async () => {
    const testEmail = getTestEmail()

    const SECRET_KEY = process.env.SUBSCRIBERS_SECRET || 'your-very-secure-secret'
    const testToken = 'seed-test'
    const { tokenHash: testTokenHash } = getHash(testToken)
    const testTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

    const { docs: userResult } = await payload.update({
      collection: customSubscribersCollectionsSlug,
      data: {
        verificationToken: testTokenHash,
        verificationTokenExpires: testTokenExpiresAt.toISOString(),
      },
      where: { email: { equals: testEmail } },
    })

    expect(userResult).toHaveLength(1)
    expect(userResult[0]).toBeDefined()

    const user = userResult[0]

    const verifyRequest = new Request(`${serverURL}/api/verifyToken`, {
      body: JSON.stringify({ email: user.email, token: testToken }),
      method: 'POST',
    })
    const verifyPayloadRequest = await createPayloadRequest({ config, request: verifyRequest })

    const verifyResponse = await createVerifyMagicLinkEndpoint({
      subscribersCollectionSlug: customSubscribersCollectionsSlug,
    }).handler(verifyPayloadRequest)
    const verifyResponseData = await verifyResponse.json()

    payload.logger.info(`called ${serverURL}/api/verifyToken`)
    payload.logger.info(`response status ${verifyResponse.status}`)
    payload.logger.info(`response data ${JSON.stringify(verifyResponseData)}`)

    expect(verifyResponse.status).toBe(200)
    expect(verifyResponseData.message).toStrictEqual('Token verified')

    const { docs: userDocsAfterVerify } = await payload.find({
      collection: customSubscribersCollectionsSlug,
      where: { email: { equals: testEmail } },
    })

    expect(userDocsAfterVerify).toHaveLength(1)
    expect(userDocsAfterVerify[0]).toBeDefined()

    const userAfterVerify = userDocsAfterVerify[0]

    expect(userAfterVerify.verificationToken).toBeOneOf(['', undefined])
    expect(userAfterVerify.verificationTokenExpires).toBeOneOf([null, undefined])
  })

  // /**
  //  *
  //  */
  // test('Can use subscribe endpoint', async () => {
  //   const testEmail = getTestEmail()

  //   const testToken = 'seed-test'
  //   const testTokenHash = crypto.createHash('sha256').update(testToken).digest('hex')
  //   const testTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

  //   const { docs: userResult } = await payload.update({
  //     collection: customSubscribersCollectionsSlug,
  //     data: {
  //       verificationToken: testTokenHash,
  //       verificationTokenExpires: testTokenExpiresAt.toISOString(),
  //     },
  //     where: { email: { equals: testEmail } },
  //   })

  //   expect(userResult).toHaveLength(1)
  //   expect(userResult[0]).toBeDefined()

  //   const user = userResult[0]

  //   const verifyRequest = new Request(`${serverURL}/api/subscribe`, {
  //     body: JSON.stringify({ email: user.email }),
  //     method: 'POST',
  //   })
  //   const subscribeRequest = await createPayloadRequest({ config, request: verifyRequest })

  //   const subscribeResponse = await subscribeEndpoint.handler(subscribeRequest)
  //   const subscribeResponseData = await subscribeResponse.json()

  //   // payload.logger.info(`response status ${subscribeResponse.status}`)
  //   // payload.logger.info(`response data ${JSON.stringify(subscribeResponseData)}`)

  //   expect(subscribeResponse.status).toBe(200)
  //   expect(subscribeResponseData.emailResult.message).toStrictEqual(
  //     "Test email to: 'seeded-by-plugin@crume.org', Subject: 'Please verify your subscription'",
  //   )

  //   const { docs: userDocsAfterVerify } = await payload.find({
  //     collection: customSubscribersCollectionsSlug,
  //     where: { email: { equals: testEmail } },
  //   })

  //   expect(userDocsAfterVerify).toHaveLength(1)
  //   expect(userDocsAfterVerify[0]).toBeDefined()

  //   const userAfterVerify = userDocsAfterVerify[0]

  //   expect(userAfterVerify.verificationToken).not.toBeOneOf(['', undefined])
  //   expect(userAfterVerify.verificationTokenExpires).not.toBeOneOf([null, undefined])
  // })
})
