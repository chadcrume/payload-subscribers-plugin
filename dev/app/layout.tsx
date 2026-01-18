import type { Metadata } from 'next'

import React from 'react'

// import RequestMagicLink from

export const metadata: Metadata = {
  description: 'Payload Subscribers Plugin dev site',
  // metadataBase: new URL('https://chad.crume.org'),
  title: {
    default: 'App using Subscribers Plugin',
    template: '%s',
  },
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <head></head>
      <body>{children}</body>
    </html>
  )
}

export default Layout
