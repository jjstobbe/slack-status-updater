# Slack Status Updater!

## Docker Compose Instructions
1) Perform the [Slack API User and Bot Tokens](README.md#slack-api-user-and-bot-tokens) setup in the main README.
0) Clone this git repo: `git clone https://github.com/<fork>/slack-status-updater.git`
0) Build the Docker image `docker build -t muchtall/slack-status-updater .`
0) Copy the example settings js to your home directory with the correct name: `cp .slack-status-updater.settings.js.EXAMPLE ~/.slack-status-updater.settings.js`
0) Modify the settings in `~/.slack-status-updater.settings.js` to meet your requirements
0) Compose your stack: `docker-compose -p "myusername-ssu" up -d` (Set `myusername-ssu` to whatever you want your stack to be named)
0) Run `docker ps -f "name=myusername-ssu_app" | grep -v ^CONTAINER | sed -re 's/.*0\.0\.0\.0:([0-9]+)-.*/\1/g'` to see the port that was assigned to your app.
0) Modify the `statusSettings.example.json` to your liking and save as `statusSettings.json`.
0) Upload the sample status settings with (replace PORT with the port number above): `curl -X POST -H "Content-Type: application/json" -d @statusSettings.json  http://localhost:PORT/update-settings?authkey=YourSuperRandomAuthKeyGoesHere ; echo ""`


Please refer back to the main [README.md](README.md) for more info on how to use this app.
