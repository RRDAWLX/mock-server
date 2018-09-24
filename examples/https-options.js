const fs = require('fs'),
  path = require('path')

module.exports = {
  cert: fs.readFileSync(path.join(__dirname, '../ca/server.crt')),
  key: fs.readFileSync(path.join(__dirname, '../ca/server.key'))
}