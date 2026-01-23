import type { Metadata } from 'next'

import { Auth } from 'payload-subscribers-plugin/ui'
import React from 'react'

import './global.css'
import { SubscriberProvider } from '../../../src/contexts/SubscriberProvider.js'
import { HomeChecker } from '../../components/HomeChecker.js'

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
      <body>
        <SubscriberProvider>
          <HomeChecker>
            <Auth />
          </HomeChecker>
          {children}
        </SubscriberProvider>
      </body>
    </html>
  )
}

export default Layout
