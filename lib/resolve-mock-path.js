const path = require('path'),
  parseApiMap = require('./parse-api-map')

let map

/**
 * @desc 根据请求路径、mock文件目录、api映射计算出目标模块路径
 * @param {object} req request 请求对象
 * @param {string} baseDir mock文件目录
 * @param {array} apiMap api映射
 * @return {string} 模块路径
 */
module.exports = (req, baseDir, apiMap) => {
  if (apiMap !== map) {
    map = apiMap
    parseApiMap(map)
  }

  for (let [, mockPath, regexp, keys] of map) {
    let result = regexp.exec(req.path)
    if (result) {
      keys.forEach(({name}, idx) => {
        req.params[name] = result[idx + 1]
        console.log(`${name}: ${result[idx + 1]}`)
      })
      return mockPath
    }
  }

  return path.join(baseDir, req.path)
}
