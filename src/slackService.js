var request = require('request')

// Handles all slack communication
function resetStatus () {
  updateStatus('', [''])
}

function selectRandomElement (items) {
  if (!items || items.length === 0) {
    return ''
  }

  return items[Math.floor(Math.random() * items.length)]
}

function sanitizeEmoji (emoji) {
  let sanitizedEmoji = emoji.trim()

  if (emoji.length === 0) {
    return emoji
  }
  if (!emoji.startsWith(':')) {
    sanitizedEmoji = ':' + emoji
  }
  if (!emoji.endsWith(':')) {
    sanitizedEmoji = emoji + ':'
  }

  return sanitizedEmoji
}

function updateStatus (text, emojis, expiration) {
  const stanitizedText = text == null ? '' : text.trim()
  const emoji = selectRandomElement(emojis)
  const sanitizedEmoji = sanitizeEmoji(emoji)

  const body = JSON.stringify({
    'status_text': stanitizedText,
    'status_emoji': sanitizedEmoji,
    'status_expiration': expiration
  })
  const encodedBody = encodeURIComponent(body)

  const token = process.env.slackUserToken
  const url = `http://slack.com/api/users.profile.set?token=${token}&profile=${encodedBody}`

  request.get(url)
}

module.exports = {
  resetStatus,
  updateStatus
}
