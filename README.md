# Master List Facebook Messages Feed

This feed tells you when you have unread Facebook messages in your private inbox.

It uses puppeteer to read your Facebook Messenger DOM and notifies whenever it notices that you have unread messages.

## Installation

### NPM

-   Install by running `npm install @zeyber/master-list-facebook-feed` in the terminal.
-   Run from installed location with `PORT=XXXX node ./node_modules/@zeyber/master-list-facebook-feed/dist/main.js`. Define the port by replacing `PORT=XXXX` (eg. `PORT=3010 ...`). The default port is 3000.

### Clone from Github

-   Clone with `git clone https://github.com/Zeyber/master-list-facebook-feed`.

#### Build

-   Build with `npm run build`.
-   Run with `PORT=3000 node dist/main.js`.

#### Run in Development mode

-   Start with `PORT=3000 npm start`.

## Usage

### Authentication

-   Create environment variables:
    -   `FACEBOOK_EMAIL` - Contains login email address.
    -   `FACEBOOK_PASSWORD` - Contains login password.
-   When starting the app, it will open a puppeteer browser at the Facebook login page and use the provided variables to fill the Email and Password fields to login to Facebook. It will then proceed to open the messenger page with the authenticated session.

Note: Non-headless authentication into session will come [here](https://github.com/Zeyber/master-list-facebook-private-inbox-feed/issues/12).

### Reading Feed Data

After the feed is initialized, you will be able to request JSON formatted data from the feed at its address.
To see this in action:

-   Open your browser and go url `http://localhost:3000` (or whichever address you have the app running).
-   You will see a JSON-formatted response with relevant data.

This format is structured in a way interpretable by the [Master List](https://github.com/Zeyber/master-list) apps. But you could also use this feed for other purposes if you wanted.

## About Master List

An organizational list that leverages third-party APIs and displays information in a simple list.

Sometimes managing so many tasks can become overwhelming (eg. emails, agenda, tasks, social media, communications across multiple platforms). It is easy lose track of what needs to be done, when and how much you really need to do.

Master List has an [App version for Browser](https://github.com/Zeyber/master-list) and a [CLI version](https://github.com/Zeyber/master-list-cli). It features connecting to APIs or feeds that can be configured to read relevant important information that ordinary users may require.

[Find out more here](https://github.com/Zeyber/master-list)
