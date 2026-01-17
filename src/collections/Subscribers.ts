import type { CollectionConfig } from 'payload'

import { OptedInChannels } from './fields/OptedInChannels.js'

const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  access: {
    // Public access for creation (signup form)
    create: () => true,
    // Admin-only access for reading, updating, and deleting
    delete: ({ req }) => (req.user ? true : false),
    read: ({ req }) => (req.user ? true : false),
    update: ({ req }) => (req.user ? true : false),
  },
  fields: [
    {
      name: 'email',
      type: 'email', // Enforces valid email format
      label: 'Email Address',
      required: true,
      unique: true, // Ensures no duplicate emails
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending', // Default to pending until verified
      label: 'Subscription Status',
      options: [
        {
          label: 'Subscribed',
          value: 'subscribed',
        },
        {
          label: 'Unsubscribed',
          value: 'unsubscribed',
        },
        {
          label: 'Pending Verification',
          value: 'pending',
        },
      ],
      required: true,
    },
    {
      name: 'source',
      type: 'text', // e.g., 'Homepage form', 'Blog post A', etc.
      label: 'Signup Source',
    },
    {
      name: 'verificationToken',
      type: 'text',
      admin: {
        hidden: true, // Hide this field in the admin panel for security/cleanliness
      },
      label: 'Verification Token',
    },
    {
      name: 'verificationTokenExpires',
      type: 'date',
      admin: {
        hidden: true, // Hide this field in the admin panel for security/cleanliness
      },
      label: 'Verification Token Expiration',
    },

    OptedInChannels,
  ],
}

export default Subscribers
