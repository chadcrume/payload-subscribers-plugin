import type { CollectionConfig } from 'payload'

const OptInChannels: CollectionConfig = {
  slug: 'opt-in-channels',
  access: {
    // Public access for creation (signup form)
    create: () => true,
    // Admin-only access for reading, updating, and deleting
    delete: ({ req }) => (req.user ? true : false),
    // read: ({ req }) => (req.user ? true : false),
    read: () => true,
    update: ({ req }) => (req.user ? true : false),
  },
  fields: [
    {
      name: 'title',
      type: 'text', // Enforces valid email format
      label: 'Title',
      required: true,
      unique: true, // Ensures no duplicate titles
    },
    {
      name: 'description',
      type: 'text',
      label: 'Description',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true, // Default to pending until verified
      label: 'Subscription Status',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'slug',
    },
  ],
}

export default OptInChannels
