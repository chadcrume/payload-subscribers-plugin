'use client'

import type { Config, OptInChannel } from '@payload-types'

import { useEffect, useMemo, useState } from 'react'
// import configPromise from '@payload-config'
import { PayloadSDK } from '@payloadcms/sdk'
// import { getPayload } from 'payload'
// import type {RequestMagicLinkResponse} from

import type { GetOptInChannelsResponse } from 'src/endpoints/getOptInChannels.js'

import styles from './SelectOptInChannels.module.css'

// const payload = await getPayload({
//   config: configPromise,
// })

// Pass your config from generated types as generic

interface ISelectOptInChannels {
  baseURL?: string
  handleOptInChannelsSelected?: (result: OptInChannel[]) => void
  props?: any
  selectedOptInChannelIDs?: string[]
}

export const SelectOptInChannels = ({
  baseURL,
  handleOptInChannelsSelected,
  selectedOptInChannelIDs,
}: ISelectOptInChannels) => {
  type OptInChannelCheckbox = {
    isChecked: boolean
  } & OptInChannel
  const [result, setResult] = useState<any>()
  const [allOptInChannels, setAllOptInChannels] = useState<OptInChannelCheckbox[]>([])

  useMemo(() => {
    async function verify() {
      const sdk = new PayloadSDK<Config>({
        baseURL: baseURL || '',
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
  }, [baseURL])

  useEffect(() => {
    const channels = result?.optInChannels?.map((channel: OptInChannel) => ({
      ...channel,
      isChecked: selectedOptInChannelIDs?.includes(channel.id),
    }))
    setAllOptInChannels(channels)
  }, [result, selectedOptInChannelIDs])

  return (
    <>
      {!baseURL ? (
        <></>
      ) : !result ? (
        <div className={styles.wrapper}>
          <div>loading...</div>
        </div>
      ) : (
        <div className={styles.wrapper}>
          <h2>Opt-in Channels</h2>
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
              <h2>Current State</h2>
              <h3>allOptInChannels</h3>
              <pre>{JSON.stringify(allOptInChannels, null, 2)}</pre>
              <h3>result</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </div>
      )}

      {/* <form
        method="POST"
        onSubmit={async (e) => {
          e.preventDefault()

          const sdk = new PayloadSDK<Config>({
            baseURL: baseURL || '',
          })

          const result = await sdk.request({
            json: {
              email,
            },
            method: 'POST',
            path: '/api/emailToken',
          })
          if (result.ok) {
            const resultJson = await result.json()
            setResult(JSON.stringify(resultJson))
            if (handleMagicLinkRequested) {
              handleMagicLinkRequested(resultJson)
            }
          } else {
            const resultText = await result.text()
            setResult(resultText)
          }
        }}
      >
        <button type="submit">Request another magic link</button>
      </form> */}
    </>
  )
}
