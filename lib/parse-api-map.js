const pathToRegexp = require('path-to-regexp'),
  mapCacheObj = {  //
    /*'/restful/:param': {  // 请求路径模式
      regexp: /^\/restful\/([^\/]+?)\/?$/i,   // 根据请求路径模式生成的正则表达式
      params: [
        {
          name: 'param'   // 路径参数
        }
      ]   // 路径参数描述对象数组
    }*/
  }

/**
 * @desc 解析 api映射，添加解析后的 正则表达式对象 和解析后的 路径参数描述对象数组。
 * 解析后的 apiMap 格式为：
 * [
 *   [
 *     '/restful/:param',
 *     'mock/path.js',
 *     /^\/restful\/([^\/]+?)\/?$/i,
 *     [
 *       {
 *         name: 'param'
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
      let params = [],
        regexp = pathToRegexp(path, params)
      mapCacheObj[path] = { regexp, params }
    }

    map[2] = mapCacheObj[path].regexp
    map[3] = mapCacheObj[path].params
  })
}
