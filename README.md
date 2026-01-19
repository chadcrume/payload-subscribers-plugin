# Payload Subscribers Plugin

A plugin to manage subscribers 

## Features

* ✔ Creates optInChannels collection
  * Fields
    * title: text
    * description: text
    * active: boolean
    * slug: text

* ✔ Creates subscribers collection
  * Fields
    * email: text
    * first name: text
    * status: Subscribed | Unsubscribed | Pending verification (default)
    * opt-ins: referenceTo optInChannels hasMany 
    * source: text
    * verificationToken: text hidden

* ✔ Modifies specified existing collections by adding a relationTo field referring to the optInChannels collection

* ✔ Provides an API to send MagicLink to Subscriber
* ✔ Provides an API to verify a MagicLink
* ✔ Provides an App Component (Server + Client) to Request MagicLink
* Provides an App Component (Server + Client) to Verify MagicLink
* Provides an App Component (Server + Client) to Sign Up

* Creates emails collection
  * Fields
    * subject: text
    * body: blocks
    * opIns: referenceTo optInChannels hasMany
    * status: draft | ready_to_send | sent
    * send date: datetime

* Provides default content blocks for use with the email body, 

* Accepts option to omit any individual default content block

* Accepts custom blocks to add to the emails body

* Provides an App Component (Server + Client) to Manage Subscriber Opt-In Channels
* Provides an App Component (Server + Client) to Unsubscribe
* Provides an App Route to Unsubscribe



* Globals
* onInit
* API
* Server Functions
* Admin Server Components
* Admin Client Components
* App Server Components
* App Client Components

