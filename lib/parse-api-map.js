const pathToRegexp = require('path-to-regexp'),
  mapObj = {}

module.exports = apiMap => {
  apiMap.forEach(map => {
    let path = map[0]

    if (!mapObj[path]) {
      let keys = [],
        regexp = pathToRegexp(path, keys)
      mapObj[path] = [regexp, keys]
    }

    map[2] = mapObj[path][0]
    map[3] = mapObj[path][1]
  })
}
