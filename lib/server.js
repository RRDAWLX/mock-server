const express = require('express'),
  http = require('http'),
  https = require('https'),
  fs = require('fs'),
  path = require('path'),
  chalk = require('chalk'),
  parseApiMap = require('./parse-api-map'),
  resolveMockPath = require('./resolve-mock-path')

/**
 * @param {number} port 端口号
 * @param {string} baseDir api 请求挂载目录
 * @param {string} apiMapFile api 映射文件，非必传
 * @param {object} httpsOpts https options 对象，非必传，如果传了此参数，则认为是开启 https
 */
module.exports = ({ port, baseDir, apiMapFile, httpsOpts }) => {
  // 检查 baseDir 是否是个文件夹
  try {
    if (!fs.statSync(baseDir).isDirectory()) {
      throw new Error()
    }
  } catch (e) {
    console.log(chalk.red(`${baseDir} is not a directory.`))
    process.exit(1)
  }

  // 检查 apiMapFile 是否是一个文件。
  try {
    if (apiMapFile && !fs.statSync(apiMapFile).isFile()) {
      throw new Error()
    }
  } catch (e) {
    console.log(chalk.red(`${apiMapFile} is not a file.`))
    process.exit(1)
  }

  // 监控mock文件目录，在文件被修改后删除相应缓存，以便服务器能响应最新的数据。
  let baseDirWatcher = fs.watch(baseDir, {
    recursive: true
  }, (event, filename) => {
    // filename 是文件在 baseDir 中的路径+文件名，如：'function.js'，'sub/test.js'
    if (filename) {
      delete require.cache[path.join(baseDir, filename)]
    }
  })

  // 如果有配置api映射文件，则监控该文件，在文件被修改后删除相应缓存，以便服务器能响应最新的数据。
  let mapFileWatcher
  if (apiMapFile) {
    mapFileWatcher = fs.watch(apiMapFile, () => {
      delete require.cache[apiMapFile]
    })
  }

  const app = new express()
  let apiMap

  app.use((req, res) => {
    // 读取 apiMap 并解析
    let newApiMap
    try {
      newApiMap = require(apiMapFile)
    } catch (e) {
      newApiMap = []
    }

    if (newApiMap !== apiMap) {
      console.log('new map')
      apiMap = newApiMap
      parseApiMap(apiMap)
    } else {
      console.log('old map')
    }

    // 获取 mock 数据模块路径
    let modulePath = resolveMockPath(req, baseDir, apiMap)

    try {
      let module = require(modulePath)

      if (typeof module === 'function') {
        module = module(req)
      }

      Promise.resolve(module).then(module => {
        res.json(module)
        console.log(chalk.green(`200: ${req.originalUrl} -> ${modulePath}`))
      }).catch(e => {
        let code // 来到这里的错误应该是服务器内部错误，所以最终的 code 应该是 5xx 系列。
        switch (typeof e) {
          case 'number':
            code = e
            e = String(e)   // 防止调用 res.send() 时覆写了状态码
            break

          case 'string':
            code = +e || 500
            break

          case 'object':
            code = e === null ? 500 : (+e.code || 500)
            break

          default:
            code = 500
        }

        if (code < 500 || code >= 600) {
          code = 500
        }

        res.status(code).send(e)
        console.log(chalk.red.bold(`${code}: ${req.originalUrl}`))
      })
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        res.sendStatus(404)
        console.log(chalk.red(`404: ${req.originalUrl}`))
      } else {
        res.sendStatus(500)
        console.log(chalk.red.bold(`500: ${req.originalUrl}`))
        // 这里的错误是 mock 模块中的代码错误，需要打印出来，方便开发者修改。
        console.log(e)
      }
    }
  })

  let server
  if (httpsOpts) {
    server = https.createServer(httpsOpts, app).listen(port)
  } else {
    server = http.createServer(app).listen(port)
  }

  console.log(chalk.blue(`mock server is listening at ${httpsOpts ? 'https' : 'http'}://localhost:${port}`))
  console.log(chalk.blue(`base directory: ${baseDir}`))
  apiMapFile && console.log(chalk.blue(`api map file: ${apiMapFile}`))
  console.log()

  server.on('close', () => {
    baseDirWatcher.close()
    mapFileWatcher && mapFileWatcher.close()
    console.log(chalk.blue(`mock server at ${port} closed`))
  })

  return server
}
