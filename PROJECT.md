# Payload Subscribers Plugin Project

## Features Roadmap

* pluginOption to input custom field specs for **subscribers** collection

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

