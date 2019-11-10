const fs = require('fs')
const path = './statusSettings.json';

function readSettingsFile () {
    const rawdata = fs.readFileSync(path);
    const json = JSON.parse(rawdata);

    return json;
}

function setSettingsFile (updatedJson) {
    fs.writeFileSync(path, updatedJson, 'utf8');

    return updatedJson;
}

module.exports = {
  readSettingsFile,
  setSettingsFile
}
