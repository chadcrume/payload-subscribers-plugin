'use client'

import { useEffect, useState } from 'react'

import type { OptInChannel } from '../../copied/payload-types.js'

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
  handleOptInChannelsSelected?: (isLoaded: OptInChannel[]) => void
  optInChannels?: OptInChannel[]
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
  optInChannels,
  selectedOptInChannelIDs,
}: ISelectOptInChannels) => {
  // const { serverURL } = { serverURL: 'http://localhost:3001' }
  type OptInChannelCheckbox = {
    isChecked?: boolean
  } & OptInChannel
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [allOptInChannels, setAllOptInChannels] = useState<OptInChannelCheckbox[]>([])

  useEffect(() => {
    setIsLoaded(false)
    const channels = optInChannels?.map((channel: OptInChannel) => ({
      ...channel,
      isChecked: selectedOptInChannelIDs?.includes(channel.id),
    }))
    if (channels) {
      setAllOptInChannels(channels)
    }
    setIsLoaded(true)
  }, [optInChannels, selectedOptInChannelIDs])

  return (
    <div className={mergeClassNames([styles.container, classNames.container])}>
      <h3>Opt-in Channels</h3>
      {!isLoaded ? (
        <p className={mergeClassNames([styles.loading, classNames.loading])}>loading...</p>
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
