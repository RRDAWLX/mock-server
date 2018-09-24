const path = require('path')

module.exports = [
  // ['/request/path', '/mock/file/path']
  ['/map/api', path.join(__dirname, './mock-files/object.js')],
]
