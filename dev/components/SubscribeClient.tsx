'use client'

import type { OptInChannel } from 'payload-types.js'

import {
  Subscribe,
  type SubscribeResponse,
  useSubscribe,
  useUnsubscribe,
} from 'payload-subscribers-plugin/ui'
import React, { useEffect, useState } from 'react'

export const SubscribeClient = ({
  handleSubscribe,
}: {
  handleSubscribe: (result: SubscribeResponse) => void
}) => {
  const [verifyData, setVerifyData] = useState<{ forwardURL?: string }>()

  useEffect(() => {
    setVerifyData({
      forwardURL: window.location.href,
    })
  }, [])

  const { optInChannels, result, status, subscriber, updateSubscriptions } = useSubscribe({
    handleSubscribe,
    verifyData: `${typeof window !== 'undefined' ? window.location.href : ''}`,
  })
  const { unsubscribe } = useUnsubscribe({ handleUnsubscribe: () => {} })
  const [selectedChannels, setSelectedChannels] = useState<OptInChannel[]>(() => {
    return subscriber?.optIns
  })

  useEffect(() => {
    console.log('subscriber?.optIns', subscriber?.optIns)
    setSelectedChannels(subscriber?.optIns || [])
  }, [subscriber])

  const handleSave = (e: React.SubmitEvent) => {
    e.preventDefault()
    void updateSubscriptions(selectedChannels.map((channel) => channel.id))
  }
  const handleUnsubscribe: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    async function call() {
      await unsubscribe()
    }
    call().catch(() => {})
  }

  return (
    <>
      <Subscribe
        classNames={{ button: 'customCss', container: 'customCss', emailInput: 'customCss' }}
        handleSubscribe={handleSubscribe}
        verifyData={verifyData ? JSON.stringify(verifyData) : undefined}
      />
      <hr />
      {subscriber && (
        <form onSubmit={handleSave}>
          {optInChannels?.map((channel) => (
            <div key={channel.id}>
              <label>
                <input
                  aria-label={channel.title}
                  checked={selectedChannels.filter((c) => c.id == channel.id).length > 0}
                  onChange={(event) => {
                    // event.preventDefault()

                    const checked = event.target.checked

                    const isSelected = 0 < selectedChannels.filter((c) => c.id == channel.id).length

                    console.log(
                      'selectedChannels.includes(channel)',
                      checked,
                      selectedChannels.includes(channel),
                      selectedChannels,
                      channel,
                    )
                    if (checked && !isSelected) {
                      setSelectedChannels([...selectedChannels, channel])
                    } else if (!checked && isSelected) {
                      const temp = selectedChannels
                      setSelectedChannels(temp.filter((c) => c.id != channel.id))
                    }
                  }}
                  type="checkbox"
                  value={channel.title}
                />
                {channel.title}
              </label>
            </div>
          ))}
          <button
            className="customCss text-sm px-2 py-0 mx-2 rounded-sm text-background bg-foreground-500"
            disabled={status === 'updating'}
            type="submit"
          >
            {!subscriber && <>Subscribe</>}
            {subscriber && subscriber?.status != 'unsubscribed' && <>Save choices</>}
            {subscriber?.status == 'unsubscribed' && <>Subscribe and save choices</>}
          </button>
          {subscriber && subscriber?.status != 'unsubscribed' && (
            <button className="customCss" onClick={handleUnsubscribe} type="button">
              Unsubscribe from all
            </button>
          )}
          {status === 'updating' && <p>{'Saving…'}</p>}
          {result && <p>{result}</p>}
        </form>
      )}
    </>
  )
}
