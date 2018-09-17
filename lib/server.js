const express = require('express'),
  fs = require('fs'),
  parse = require('url').parse,
  path = require('path'),
  chalk = require('chalk')

/**
 * @desc 根据请求路径、mock文件目录、api映射计算出目标模块路径
 * @param reqPath {string} 请求路径
 * @param baseDir {string} mock文件目录
 * @param apiMap {array} api映射
 * @return {string} 模块路径
 */
function resloveModulePath(reqPath, baseDir, apiMap) {
  for (let item of apiMap) {
    if (item[0] == reqPath) {
      return item[1]
    }
  }

  return path.join(baseDir, reqPath)
}

module.exports = (port, baseDir, apiMapFile) => {
  let app = new express()

  // 监控mock文件目录，在文件被修改后删除相应缓存，以便服务器能响应最新的数据。
  let baseDirWatcher = fs.watch(baseDir, {
    recursive: true
  }, (event, filename) => {
    if (filename) {
      delete require.cache[path.join(baseDir, filename)]
    }
  })

  // 如果有配置api映射文件，则监控该文件，在文件被修改后删除相应缓存，以便服务器能响应最新的数据。
  let mapFileWather
  if (apiMapFile) {
    mapFileWather = fs.watch(apiMapFile, () => {
      delete require.cache[apiMapFile]
    })
  }

  app.use((req, res, next) => {
    let apiMap
    try {
      apiMap = require(apiMapFile)
    } catch (e) {
      apiMap = []
    }

    let modulePath = resloveModulePath(req.path, baseDir, apiMap)
    try {
      let module = require(modulePath)

      if (typeof module == 'function') {
        module = module(req)
      }

      res.json(module)
      console.log(chalk.green(`200: ${req.path} -> ${modulePath}`))
    } catch (e) {
      res.sendStatus(404)
      console.log(chalk.red(`404: ${req.path}`))
    }
  })

  const server = app.listen(port, function() {
    console.log(`Mock server is listening at ${port}`)
  })

  server.on('close', () => {
    baseDirWatcher.close()
    mapFileWather && mapFileWather.close()
    console.log(`Mock server at ${port} closed`)
  })
}
