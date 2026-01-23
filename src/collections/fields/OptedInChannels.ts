import type { Field } from 'payload'

export const OptedInChannels: Field = {
  name: 'optIns',
  type: 'relationship',
  admin: {
    position: 'sidebar',
  },
  hasMany: true,
  label: 'Opted-in channels',
  relationTo: 'opt-in-channels',
}
