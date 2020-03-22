const fs = require('fs')
const extension = /\.(js|json)$/

module.exports = function (modulePath) {
  let paths

  if (extension.test(modulePath)) {
    paths = [modulePath]
  } else {
    paths = [
      `${modulePath}.js`,
      `${modulePath}.json`,
      `${modulePath}/index.js`,
      `${modulePath}/index.json`,
    ]
  }

  for (let path of paths) {
    try {
      fs.accessSync(path)
      return true
    } catch (e) {}
  }
  
  return false
}