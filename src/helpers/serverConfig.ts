export const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

export const getServerSideURL = () => {
  const serverSideURL = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_DEV_URL
        ? `http://${process.env.NEXT_PUBLIC_DEV_URL}`
        : 'http://localhost:3000'
  // console.log(`process.env.NEXT_PUBLIC_DEV_URL: ${process.env.NEXT_PUBLIC_DEV_URL}`)
  // console.log(`serverSideURL: ${serverSideURL}`)
  return serverSideURL
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port
    // `${window.location.protocol}//${window.location.host}
    const clientSideURL = `${protocol}//${domain}${port ? `:${port}` : ''}`
    // console.log(`clientSideURL: ${clientSideURL}`)
    return clientSideURL
  }

  return getServerSideURL()
}

export const serverURL = getClientSideURL()
