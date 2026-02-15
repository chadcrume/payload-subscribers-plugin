'use client'

import { PayloadSDK } from '@payloadcms/sdk'
import { useEffect, useState } from 'react'

import type { Config, OptInChannel } from '../../copied/payload-types.js'
import type { GetOptInChannelsResponse } from '../../endpoints/getOptInChannels.js'

import { useServerUrl } from '../../react-hooks/useServerUrl.js'
import { mergeClassNames } from './helpers.js'
import styles from './shared.module.css'

/**
 * Props for the SelectOptInChannels component.
 *
 * @property classNames - Optional CSS class overrides for the component elements
 * @property handleOptInChannelsSelected - Callback with the list of selected opt-in channels
 * @property props - Optional passthrough props (reserved for future use)
 * @property selectedOptInChannelIDs - Optional channel IDs to pre-select
 */
export interface ISelectOptInChannels {
  classNames?: SelectOptInChannelsClasses
  handleOptInChannelsSelected?: (result: OptInChannel[]) => void
  props?: any
  selectedOptInChannelIDs?: string[]
}

/**
 * Optional CSS class overrides for SelectOptInChannels elements.
 *
 * @property button - Class for buttons
 * @property container - Class for the main container
 * @property error - Class for error messages
 * @property form - Class for the form
 * @property loading - Class for loading state
 * @property message - Class for message text
 * @property optInCheckbox - Class for each checkbox input
 * @property optInCheckboxItem - Class for each checkbox row/item
 * @property optInCheckboxLabel - Class for checkbox labels
 * @property optionsGroup - Class for the group wrapping all checkboxes
 */
export type SelectOptInChannelsClasses = {
  button?: string
  container?: string
  error?: string
  form?: string
  loading?: string
  message?: string
  optInCheckbox?: string
  optInCheckboxItem?: string
  optInCheckboxLabel?: string
  optionsGroup?: string
}

/**
 * Fetches active opt-in channels from GET /api/optinchannels and renders a list of checkboxes.
 * Reports selected channels via handleOptInChannelsSelected. Supports pre-selection via selectedOptInChannelIDs.
 *
 * @param props - Component props (see ISelectOptInChannels)
 * @param props.classNames - Optional class overrides for the component elements
 * @param props.handleOptInChannelsSelected - Callback with the list of selected opt-in channels
 * @param props.selectedOptInChannelIDs - Optional channel IDs to pre-select
 * @returns Section titled "Opt-in Channels" with checkboxes and loading/error state
 */
export const SelectOptInChannels = ({
  classNames = {
    button: '',
    container: '',
    error: '',
    form: '',
    loading: '',
    message: '',
    optInCheckbox: '',
    optInCheckboxItem: '',
    optInCheckboxLabel: '',
    optionsGroup: '',
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
    <div className={mergeClassNames([styles.container, classNames.container])}>
      <h3>Opt-in Channels</h3>
      {!result ? (
        <p className={mergeClassNames([styles.loading, classNames.loading])}>verifying...</p>
      ) : (
        <div className={mergeClassNames([styles.optionsGroup, classNames.optionsGroup])}>
          {// Map over the tasks array to render each checkbox
          allOptInChannels?.map((channel) => (
            <div
              className={mergeClassNames([styles.optInCheckboxItem, classNames.optInCheckboxItem])}
              key={channel.id}
            >
              <label
                className={mergeClassNames([
                  styles.optInCheckboxLabel,
                  classNames.optInCheckboxLabel,
                ])}
              >
                <input
                  aria-label={channel.title}
                  // The checked prop is controlled by the state
                  checked={channel.isChecked}
                  className={mergeClassNames([styles.optInCheckbox, classNames.optInCheckbox])}
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
