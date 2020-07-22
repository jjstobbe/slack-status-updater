# Slack Status Updater!

## Overview
_Do you waste time setting your slack status multiple times a day?_

_Do you want to let your coworkers know if you're available?_

_Do you want to automate literally everything in your life?_

Then this is the app for you!

This app reads your Office 365 or Exchange calendar and sets your corresponding Slack status automatically!

## Features

- You can set custom emojis and/or text on the status.
- Automatically expires your status when the meeting is scheduled to end.
- It refreshes every minute to take into account your latest calendar changes

Best part of all, it's completely free! This app is designed to run on the Heroku and MongoDB Atlas free tier of services!

- [Setup](#Setup)
  - [Slack API User and Bot Tokens](#Slack API User and Bot Tokens)
  - [MongoDB Atlas (Cloud)](#MongoDB Atlas
  - [Heroku](#Heroku)
- [Usage](#Usage)
- [Known Issues](#Known Issues)

## Setup
### Slack API User and Bot Tokens
0) Go to https://api.slack.com/apps
0) Click **Create New App**
0) Set an **App Name** of "\<username\>-slack-status-updater" (using your username for clarity)
0) If presented: Select your **Development Slack Workspace**
0) Under Features, go to **OAuth & Permissions**
0) Under Scopes > Bot Token Scopes, and click **Add an OAuth Scope** then add the following scope:
    - chat:write
0) Under Scopes > User Token Scopes, and for each of the scopes below, click **Add an OAuth Scope** then add the scope:
    - users.profile:write
    - users:read (NOT admin.users:read)
    - users:write (NOT admin.users:write)
0) At the top of the page, click **Install App to Workspace**
0) When prompted, click **Allow** to grant the required permissions
0) Copy the User (OAuth Access Token) and Bot (Bot User OAuth Access Token) tokens and take note of them
0) Optional:
   - Pretty up your app with a custom description and icon under Settings > Basic Information > Display Information
   - If you like having green presence dots next to bots, go to Features > App Home > Your App's Presence in Slack, Always Show My Bot as Online and set that to On

### MongoDB Atlas
0) Create an account with MongoDB Atlas (Cloud) and log in (https://www.mongodb.com/cloud/atlas)
    - You can use the free **Shared Clusters** tier
    - Proceed with defaults
0) Create a new cluster
0) Wait a few minutes for the cluster to be created (refresh the page to manually update status)
0) Once created, click **Connect**
0) Click **Allow Access from Anywhere**
   - Since Heroku runs on AWS, the IP ranges we would allow are in flux, therefore this is the maintenance-free option. If you wish, you could specifically whitelist AWS IP ranges to limit access somewhat.
0) Set a database user account with a name like "slack-status-updater" and a password you choose (use something relatively complex), and click **Create Database User**
0) Within your cluster, create a database (using the **Add My Own Data** option) with a name of "slack-status-updater", and with a collection named
"status-settings"
0) Under "Overview", click **Connect**
0) Click **Connect your application**
0) Select Node.js, version 3.6 or later, and then click **Copy**. Take note of this URL.

### Heroku
1) Spin up a new project on [heroku](https://devcenter.heroku.com/articles/free-dyno-hours)
2) git clone this repository onto the new heroku server
3) Set these configuration variables
    - exchange_username (ie: username@domain.local)
    - exchange_password
    - exchange_host_url
      - If using O365, use: https://outlook.office365.com
      - If using Exchange/OWA, use: https://my-owa.hostname.com (using your OWA URL)
    - exchange_authtype
      - For O365, try "basic"
      - For OWA, try "ntlm", "basic", or "bearer"
    - mongoUri
      - Copied during the MongoDB Atlas setup. Should look something like this:
        - 'mongodb+srv://slack-status-updater:\<your-password-here\>@clusterX.abcdef.mongodb.net/slack-status-updater?retryWrites=true&w=majority)
    - slackBotToken (Bot User OAuth Access Token, starts with "xoxb-")
    - slackUserToken (OAuth Access Token, starts with "xoxp-")
    - reminderUserId (If set, sends a meeting reminder to that user in Slack ~2 minutes before a meeting starts)
      - To get your UserId, open your Slack profile in a browser window and look for the ID hash in the URL immediately following ".../user_profile/". This should look something like "PX24VL9T2".
4) Setup the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) add-on to run every morning when you need your status updated
    - Mine runs "Every day at..." "01:00 PM UTC"
    - Run Command: "npm run start"

## Usage
- Calendar events created as all-day events take ultimate precedence. Use this for events where you are unavailable all day, such as Sick Days or Vacations/Holidays.
- In case of two events on the calendar that overlap, events that started most recently are reflected in your status.
- If two or more events share identical timeframes, the event most recently added to your calendar seems to take precedence.
- Tip: If you want to set a custom availability status during your workday, but still be available on your calendar, create an event that spans your work hours, and set the "Show As" appointment attribute to "Free". Use this for things like "Working from Home", "Traveling for Work", or "Self Quarantining". Set this as recurring per your needs.

## Known Issues
- You cannot override a set status for a current event from within Slack. It will be effectively re-applied every minute until that event ends.

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jjstobbe/slack-status-updater/issues)

## Author

**Jack Stobbe**

* [github/](https://github.com/jjstobbe)

## License

Copyright © 2019 [Jack Stobbe](https://jjstobbe.github.io)
Licensed under the MIT license.

***
