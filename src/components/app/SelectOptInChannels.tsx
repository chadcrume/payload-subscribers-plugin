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

export interface ISelectOptInChannels {
  classNames?: SelectOptInChannelsClasses
  handleOptInChannelsSelected?: (result: OptInChannel[]) => void
  props?: any
  selectedOptInChannelIDs?: string[]
}

export type SelectOptInChannelsClasses = {
  button?: string
  error?: string
  form?: string
  loading?: string
  message?: string
  optInCheckbox?: string
  optInCheckboxItem?: string
  optInCheckboxLabel?: string
  optionsGroup?: string
  wrapper?: string
}

export const SelectOptInChannels = ({
  classNames = {
    button: '',
    error: '',
    form: '',
    loading: '',
    message: '',
    optInCheckbox: '',
    optInCheckboxItem: '',
    optInCheckboxLabel: '',
    optionsGroup: '',
    wrapper: '',
  },
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
    <div className={`${styles.container} ${classNames.container}`}>
      <h3>Opt-in Channels</h3>
      {!result ? (
        <p className={`${styles.loading} ${classNames.loading}`}>verifying...</p>
      ) : (
        <div className={`${styles.optionsGroup} ${classNames.optionsGroup}`}>
          {// Map over the tasks array to render each checkbox
          allOptInChannels?.map((channel) => (
            <div
              className={`${styles.optInCheckboxItem} ${classNames.optInCheckboxItem}`}
              key={channel.id}
            >
              <label className={`${styles.optInCheckboxLabel} ${classNames.optInCheckboxLabel}`}>
                <input
                  aria-label={channel.title}
                  // The checked prop is controlled by the state
                  checked={channel.isChecked}
                  className={`${styles.optInCheckbox} ${classNames.optInCheckbox}`}
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
        </div>
      )}
    </div>
  )
}
