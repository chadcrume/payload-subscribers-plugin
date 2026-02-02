# Payload Subscribers Plugin

A plugin to manage subscribers and the "channels" they can subscribe to.

## Installation

```bash
pnpm add payload-subscribers-plugin
```

## Usage

Add the plugin to your Payload config.

```typescript
// payload.config.ts

export default buildConfig({
  plugins: [
    payloadSubscribersPlugin({
      collections: {
        // Add slugs of your collections which should have a relationship field to the optInChannels.
        posts: true,
      },
      // Easily disable the collection logic.
      disabled: false,
      // Provide a custom expiration for magic link tokens. The default is 30 minutes.
      tokenExpiration: 60 * 60,
    }),
  ],
})
```

Place the **SubscriberProvider** at the a good location in your app structure. For example, in your root layout:

```typescript
// layout.tsx

import { SubscriberProvider } from 'payload-subscribers-plugin/ui'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <head></head>
      <body>
        <SubscriberProvider>
          ...
        </SubscriberProvider>
      </body>
    </html>
  )
}
```

Then you can use the components in your app:

```typescript
// page.tsx

import { RequestOrSubscribe } from 'payload-subscribers-plugin/ui'

const Page = () => {
  return (
    <main>
      <RequestOrSubscribe
        classNames={{ button: 'customCssClassNames', container: 'customCssClassNames', emailInput: 'customCssClassNames' }}
      />
    </main>
  )
}
```

**_IMPORANT:_** Be sure to create a /verify route

```typescript
// verify/page.tsx

import { VerifyClient } from '@/components/VerifyClient.js'

const Page = () => {
  return (
    <main id="main-content">
      <VerifyMagicLink
        classNames={{ button: 'customCssClassNames', container: 'customCssClassNames', emailInput: 'customCssClassNames' }}
      />
    </main>
  )
}
```

## 🟢🔵🔴 Features

### 🟢 Plugin options

#### **collections**

You can specify collections in the plugin options which will be amended to include a relationTo field referring to the optInChannels collection. Right now this does not override the plugin-added subscribers collection, which is still used for the primary record of subscribers and used for authentication. The collections amended with an optIns can be used, for example, to manage your subscription channels and any email campaigns related.

#### **disabled**

#### **tokenExpiration**

### 🟢 Collections

#### **optInChannels**

Seeded when plugin inits.

- Fields
  - title: text
  - description: text
  - active: boolean
  - slug: text

#### **subscribers**

Seeded when plugin inits.

- Fields
  - email: text
  - first name: text
  - status: Subscribed | Unsubscribed | Pending verification (default)
  - opt-ins: referenceTo optInChannels hasMany
  - source: text
  - verificationToken: text hidden

---

### 🔵 Fields

#### **OptedInChannels**

_THE FIELD SPEC IS CURRENTLY NOT EXPORTED_ Documenting here in case that seems useful in the future.

This is the same field used by the plugin **collections** to amended a relationTo field referring to the optInChannels collection.

---

### 🔴 Payload endpoints

#### **requestMagicLink**

Takes an email, verifies it, registers it if unknown, constructs a magic link, and uses your Payload emailAdapter to sendEmail.

#### **verifyMagicLink**

Takes an email and token, verifies the token, and authenticates the user, using Payload's HTTP-only cookies auth.

#### **getOptInChannels**

Returns all active optInChannels data.

#### **subscribe** a user, or update a subscriber's opt-ins.

Takes an email and list of optInChannel IDs, verifies them, and if the authenticated subscriber matches the email will update the channels that subscriber is opted into.

#### TO DO: unsubscribe

The **subscribe** endpoint will remove all optIns. But need a way to set the subscriber status to "unsubscribed"

---

### 🟢 SubscriberProvider provider with useSubscriber context

---

### 🔵 Provides several NextJS client components ready for use in a frontend app

- All App Components are client components that consume hooks, server components, server functions. Including the useSubscriber context, and so the must be used within the children descendent tree of the SubscriberProvider provider.

- All App Components accept a **classNames** prop to specify CSS class names to add to the different parts of the component

#### **RequestOrSubscribe**

Shows Subscribe to authenticated subscribers, otherwise shows RequestMagicLink.

<!-- <div style="border: 1px solid #ccc; padding: 15px; border-radius: 5px;">
</div> -->

```typescript
  <RequestMagicLink
    // Provide your own global class names to add to the component elements. Optional
    classNames={{
      button: 'customCssClassNames',
      container: 'customCssClassNames',
      emailInput: 'customCssClassNames',
      error: 'customCssClassNames',
      form: 'customCssClassNames',
      loading: 'customCssClassNames',
      message: 'customCssClassNames',
      section: 'customCssClassNames',
    }}
    // Called after a subscribers opt-ins have been updated. Optional
    handleMagicLinkRequested={async (result: RequestMagicLinkResponse) => {}}
    // Called after a subscribers opt-ins have been updated. Optional
    handleSubscribe={async (result: SubscribeResponse) => {}}
    // Provided your own button component. Optional
    renderButton={({ name, onClick, text }) =>
      <button name={name} onClick={onClick} type="button">
        {text}
      </button>
    }
  />
```

#### **RequestMagicLink**

Form to input email address and get a magic link email sent.

```typescript
  <RequestMagicLink
    // Provide your own global class names to add to the component elements. Optional
    classNames={{
      button: 'customCssClassNames',
      container: 'customCssClassNames',
      emailInput: 'customCssClassNames',
      error: 'customCssClassNames',
      form: 'customCssClassNames',
      message: 'customCssClassNames',
    }}
    // Called after a subscribers opt-ins have been updated. Optional
    handleMagicLinkRequested={async (result: RequestMagicLinkResponse) => {}}
    // Provided your own button component. Optional
    renderButton={({ name, onClick, text }) =>
      <button name={name} onClick={onClick} type="button">
        {text}
      </button>
    }
  />
```

#### **VerifyMagicLink**

Component that verifies a magic link using expected url parameters.

```typescript
  <VerifyMagicLink
    // Provide your own global class names to add to the component elements. Optional
    classNames={{
      button: 'customCssClassNames',
      container: 'customCssClassNames',
      error: 'customCssClassNames',
      form: 'customCssClassNames',
      loading: 'customCssClassNames',
      message: 'customCssClassNames',
    }}
    // Called after a magic link email has been sent. Optional
    handleMagicLinkRequested={async (result: RequestMagicLinkResponse) => {}}
    // Called after a magic link has been verified. Optional
    handleMagicLinkVerified={async (result: RequestMagicLinkResponse) => {}}
    // Provided your own button component. Optional
    renderButton={({ name, forwardUrl, onClick, text }) =>
      forwardUrl ? (
        <a href={forwardUrl}>
          <button name={name} type="button">
            {text}
          </button>
        </a>
      ) : (
        <button name={name} onClick={onClick} type="button">
          {text}
        </button>
      )
    }
  />
```

#### **Subscribe**

Allows a subscriber to select from among all active optInChannels.

```typescript
  <Subscribe
    // Provide your own global class names to add to the component elements. Optional
    classNames={{
      button: 'customCssClassNames',
      container: 'customCssClassNames',
      emailInput: 'customCssClassNames',
      error: 'customCssClassNames',
      form: 'customCssClassNames',
      loading: 'customCssClassNames',
      message: 'customCssClassNames',
      section: 'customCssClassNames',
    }}
    // Called after a subscribers opt-ins have been updated. Optional
    handleSubscribe={async (result: SubscribeResponse) => {}}
    // Provided your own button component. Optional
    renderButton={({ name, onClick, text }) =>
      <button name={name} onClick={onClick} type="button">
        {text}
      </button>
    }
  />
```

#### **SubscriberMenu**

```typescript
// classNames prop

export type SubscriberMenuClasses = {
  button?: string
  container?: string
}
```
