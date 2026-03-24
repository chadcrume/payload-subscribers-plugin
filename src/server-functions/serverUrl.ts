'use server'

const getServerSideURL = () => {
  // Use NEXT_PUBLIC_WEBSITE_URL for dev and production
  // Otherwise use VERCEL_URL
  const serverSideURL = process.env.NEXT_PUBLIC_WEBSITE_URL
    ? process.env.NEXT_PUBLIC_WEBSITE_URL
    : `https://${process.env.VERCEL_URL}`
  // console.log(`serverSideURL: ${serverSideURL}`)
  return serverSideURL || ''
}

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerUrl = async (): Promise<{ serverURL: string }> => {
  return { serverURL: getServerSideURL() }
}
