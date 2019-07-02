# slackstatusupdater

## Overview
Do you waste time setting your slack status multiple times a day?

Do you want to let your coworkers know if you're available?

Do you just hate the outlook extension that does this?

Then this is the app for you!

This app reads your calendar and sets your corresponding slack status automatically!

## Features

- You can set custom emojis and/or text on the status.
- Automatically expires when the meeting is scheduled to end.
- It refreshes every 2 minutes to take into account your latest calendar changes

## Setup

Best part of all, it's completely free! This app is designed to run on Heroku's free tier of servers!

1) Spin up a new project on [heroku](https://devcenter.heroku.com/articles/free-dyno-hours)
2) git clone this repository onto the new heroku server
3) Set these 3 config vars
  - office365username
  - office365password
  - slackUserToken
4) Setup the [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) add-on to run every morning when you need your status updated
  - Mine runs "Every day at..." "01:00 PM UTC"
  - Run Command: "node slack-status-updater.js"

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jjstobbe/slackstatusupdater/issues)

## Author

**Jack Stobbe**

* [github/](https://github.com/jjstobbe)

## License

Copyright © 2019 [Jack Stobbe](#Jack Stobbe)
Licensed under the MIT license.

***