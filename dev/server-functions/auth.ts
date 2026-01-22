'use server'

import config from '@payload-config'

// If you're using Next.js, you'll have to import headers from next/headers, like so:
import { headers as nextHeaders } from 'next/headers.js'
import { getPayload, type Payload } from 'payload'

// result will be formatted as follows:
// {
//    permissions: { ... }, // object containing current user's permissions
//    user: { ... }, // currently logged in user's document
//    responseHeaders: { ... } // returned headers from the response
// }

const payload: Payload = await getPayload({ config })

export const auth = async () => {
  // you'll also have to await headers inside your function, or component, like so:
  const headers = await nextHeaders()

  try {
    const { permissions, user } = await payload.auth({
      // canSetHeaders: false,
      headers,
    })
    // console.log('{ permissions, user }', { permissions, user })

    return { permissions, user }
  } catch (error) {
    console.log('error', error)
    return { error }
  }
}
