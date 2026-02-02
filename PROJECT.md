# Payload Subscribers Plugin Project

## To do before initial npm publish

* ✔ Upgrade all packages, including node, payload, next, etc
* ✔ Improve README for Components
* ✔ Parameterize collection to use for auth
* Add renderButton to all Components that have a button


## Features Roadmap

* Update request+verify to use Payload's forgot and reset flow?
  
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



* Globals - none as of now
* onInit
* Server Functions - none public
* Admin Server Components - none
* Admin Client Components
* App Server Components
* App Client Components

