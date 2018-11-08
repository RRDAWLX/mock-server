const path = require('path')

/**
 * @desc 根据请求路径、mock文件目录、api映射计算出目标 mock 数据模块路径
 * @param {object} req request 请求对象
 * @param {string} baseDir mock文件目录
 * @param {array} apiMap api映射
 * @return {string} 模块路径
 */
module.exports = (req, baseDir, apiMap) => {
  for (let [, mockPath, regexp, keys] of apiMap) {
    // 检测请求路径是否与当前路由模式匹配
    let result = regexp.exec(req.path)
    if (result) {
      // 将解析后的路径参数附着到 req 的 params 对象上
      keys.forEach(({name}, idx) => {
        req.params[name] = result[idx + 1]
      })
      return mockPath
    }
  }

  // 如果在 apiMap 中无匹配的路由配置，则结合 baseDir 与 请求路径 生成最终的 mock 数据模块路径
  return path.join(baseDir, req.path)
}
