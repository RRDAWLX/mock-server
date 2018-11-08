const pathToRegexp = require('path-to-regexp'),
  mapCacheObj = {  //
    /*'/request/path': [  // 请求路径模式
      /^\/restful\/([^\/]+?)\/?$/i,   // 正在表达式实例
      [
        {
          name: 'paramName'   // 路径参数
        }
      ]   // 路径参数描述对象数组
    ]*/
  }

/**
 * @desc 解析 api映射，添加解析后的 正则表达式对象 和解析后的 路径参数描述对象数组。
 * 解析后的 apiMap 为：
 * [
 *   [
 *     "request/path",
 *     "mock/path.js",
 *     /^\/restful\/([^\/]+?)\/?$/i,
 *     [
 *       {
 *         name: "paramName"
 *       }
 *     ]
 *   ]
 * ]
 * @param {array} apiMap api映射
 */
module.exports = apiMap => {
  apiMap.forEach(map => {
    let path = map[0]

    if (!mapCacheObj[path]) {
      let keys = [],
        regexp = pathToRegexp(path, keys)
      mapCacheObj[path] = [regexp, keys]
    }

    map[2] = mapCacheObj[path][0]
    map[3] = mapCacheObj[path][1]
  })
}
