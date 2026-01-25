'use client'

import type { Config, OptInChannel } from '@payload-types'

import { useEffect, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'
// import type {RequestMagicLinkResponse} from

import type { GetOptInChannelsResponse } from 'src/endpoints/getOptInChannels.js'

import { useServerUrl } from '@react-hooks/useServerUrl.js'

import styles from './shared.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface ISelectOptInChannels {
  handleOptInChannelsSelected?: (result: OptInChannel[]) => void
  props?: any
  selectedOptInChannelIDs?: string[]
}

export const SelectOptInChannels = ({
  handleOptInChannelsSelected,
  selectedOptInChannelIDs,
}: ISelectOptInChannels) => {
  const { serverURL } = useServerUrl()
  // const { serverURL } = { serverURL: 'http://localhost:3001' }
  type OptInChannelCheckbox = {
    isChecked: boolean
  } & OptInChannel
  const [result, setResult] = useState<any>()
  const [allOptInChannels, setAllOptInChannels] = useState<OptInChannelCheckbox[]>([])

  useEffect(() => {
    async function verify() {
      const sdk = new PayloadSDK<Config>({
        baseURL: serverURL || '',
      })

      console.log('calling optinchannels endpoint')
      const result = await sdk.request({
        method: 'GET',
        path: '/api/optinchannels',
      })
      if (result.ok) {
        const resultJson: GetOptInChannelsResponse = await result.json()
        setResult(resultJson)
      } else {
        const resultText = await result.text()
        setResult(resultText)
      }
    }
    void verify()
  }, [serverURL])

  useEffect(() => {
    const channels = result?.optInChannels?.map((channel: OptInChannel) => ({
      ...channel,
      isChecked: selectedOptInChannelIDs?.includes(channel.id),
    }))
    setAllOptInChannels(channels)
  }, [result, selectedOptInChannelIDs])

  return (
    <>
      {!result ? (
        <div className={styles.wrapper}>
          <div>loading...</div>
        </div>
      ) : (
        <div className={styles.wrapper}>
          <h3>Opt-in Channels</h3>
          {/* Map over the tasks array to render each checkbox */}
          {allOptInChannels?.map((channel) => (
            <div key={channel.id}>
              <label>
                <input
                  aria-label={channel.title}
                  // The checked prop is controlled by the state
                  checked={channel.isChecked}
                  // The onChange handler calls the update function with the item's ID
                  onChange={(event) => {
                    event.preventDefault()

                    const checked = event.target.checked

                    if (handleOptInChannelsSelected) {
                      handleOptInChannelsSelected(
                        allOptInChannels
                          .map((channel) => ({
                            ...channel,
                            isChecked:
                              channel.title == event.target.value ? checked : channel.isChecked,
                          }))
                          .filter((c) => c.isChecked)
                          .map((channel) => ({ ...channel, isChecked: undefined })),
                      )
                    }
                  }}
                  type="checkbox"
                  value={channel.title}
                />
                {channel.title}
              </label>
            </div>
          ))}
          {/* Optional: Display the current state for verification */}
          {false && (
            <>
              <h3>Current State</h3>
              <h3>allOptInChannels</h3>
              <pre>{JSON.stringify(allOptInChannels, null, 2)}</pre>
              <h3>result</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </>
  )
}
