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
- It refreshes every minute to take into account your latest calendar changes.
- If your O365/Exchange account password changes, the bot will ask you for the updated password.

Best part of all, it's completely free! This app is designed to run on the Heroku and MongoDB Atlas free tier of services!

**Do you prefer to roll your own Docker containers?** See these alternate  [Docker Compose Instructions](README.Docker_Compose.md)

- [Setup](#setup)
  - [Slack API User and Bot Tokens](#slack-api-user-and-bot-tokens)
  - [MongoDB Atlas](#mongodb-atlas)
  - [Heroku](#heroku)
- [Usage](#usage)
- [Known Issues](#known-issues)

## Setup
### Slack API User and Bot Tokens
1) Go to https://api.slack.com/apps
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
1) Create an account with MongoDB Atlas (Cloud) and log in (https://www.mongodb.com/cloud/atlas)
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
#### Initial Setup
1) Create a new app in Heroku (https://dashboard.heroku.com/new-app)
0) Set your app name to something unique (like "myname-ssu"), and click **Create App**
0) In your Heroku app settings, under Config Vars, reveal and add these variable keys, along with the values you provide:
    - isProduction (set to "true")
    - exchange_username (ie: username@domain.local)
    - exchange_password
      - If you set this to "" (blank), the bot will ask you for your password when it first tries to log in.
    - exchange_host_url
      - If using O365, use: https://outlook.office365.com
      - If using Exchange/OWA, use: https://my-owa.hostname.com (using your OWA URL)
    - exchange_authtype
      - For O365, try "basic"
      - For OWA, try "ntlm", "basic", or "bearer"
    - mongoUri
      - Copied during the MongoDB Atlas setup. Should look something like this:
        - 'mongodb+srv://slack-status-updater:\<your-password-here\>@clusterX.abcdef.mongodb.net/slack-status-updater?retryWrites=true&w=majority)
    - heroku_url (The URL of this Heroku app, ie https://myappname.herokuapp.com/)
    - authkey (Come up with a unique long secret/password value for this. Used to restrict requests to the Heroku app)
    - slackBotToken (Bot User OAuth Access Token, starts with "xoxb-")
    - slackUserToken (OAuth Access Token, starts with "xoxp-")
    - slackUserId (If set, sends a meeting reminder to that user in Slack ~2 minutes before a meeting starts)
      - To get your UserId, open your Slack profile in a browser window and look for the ID hash in the URL immediately following ".../user_profile/". This should look something like "PX24VL9T2".
#### Deploy
1) On your computer, clone this git repo (`git clone https://github.com/<fork>/slack-status-updater.git`)
0) `cd slack-status-updater`
0) Using the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-command-line): `heroku git:remote -a myname-ssu` (using your Heroku app name)
   - You may be presented with a URL that you will need to open up in your browser to complete the login
0) Then deploy the app: `git push heroku master`
0) Once deployed, post the example settings json: `curl -X POST -H "Content-Type: application/json" -d @statusSettings.example.json  https://myname-ssu.herokuapp.com/update-settings?authkey=<your_authkey_here> ; echo ""`
0) Feel free to modify the settings json and re-upload with your customized statuses and emoji!

#### Updates
To update from this repo, simply:

1) `git pull`
0) `git push heroku master`

## Usage
### statusSettings.json
- fallback_status_event
  - status_text: **String** that serves as your default event status in case no other matches exist.
  - status_emojis: **Array** of emojis you wish to have randomly assigned to this status. Setting one emoji will result in a consistent emoji for the status.
- ignored_events
  - matching_words: **Array** of event subjects you wish to ignore, leaving your Slack status unchanged.
- override_priority: **Array** of event subjects, ordered by priority, which take precedence over any other conflicting event.
- persist_calendar_status: **Boolean** (true/false) Enables or disables persistent Slack status updates. If disabled/false, changes manually you make to your Slack status will remain in place until a calendar event starts or expires. If enabled/true, manual status changes will be overridden.
- status_events (**Array**)
  - For each array element...
    - matching_words: **Array** of words or phrases that would match a specific calendar subjects' event type (ie, for vacation events, "Vacation", "PTO", "Time Off")
    - status_emoji: **Array** of emojis to randomly use for this status. Setting one emoji will result in a consistent emoji for the status.
    - status_text: **String** specifying the status text to be set for this event subject match.
    - check_for_status_in_title: **Boolean** (true/false) If set to true, the app will use ": " or " - " as a delimiter, treating the second field as the custom status to be used (ie, "Vacation: Camping" will display "Camping" as your status with the emoji specified above)

- Aside from the above...
  - In case of two events on the calendar that overlap, events that started most recently are reflected in your status.
  - If two or more events share identical timeframes, the event most recently added to your calendar seems to take precedence.

### Tips
- If you want to set a custom availability status during your workday, but still be available on your calendar, create an event that spans your work hours, and set the "Show As" appointment attribute to "Free". Use this for things like "Working from Home", "Traveling for Work", or "Self Quarantining". Set this as recurring per your needs.

## Known Issues

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jjstobbe/slack-status-updater/issues)

## Authors and Contributors

**Jack Stobbe** (Author)
* [github/](https://github.com/jjstobbe)

**John Holmstadt** (Contributor)
* [https://github.com/muchtall](https://github.com/muchtall)

## License

Copyright © 2019 [Jack Stobbe](https://jjstobbe.github.io)
Licensed under the MIT license.

***
