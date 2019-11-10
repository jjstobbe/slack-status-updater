const fs = require('fs')

function readSettingsFile () {
    const rawdata = fs.readFileSync('./statusSettings.json');
    const json = JSON.parse(rawdata);

    return json;
}

function setSettingsFile () {
    return "fuck idk"; 
}

module.exports = {
  readSettingsFile,
  setSettingsFile
}
