const express = require('express')
const bodyParser = require('body-parser')
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const parseApiMap = require('./parse-api-map')
const resolveMockPath = require('./resolve-mock-path')

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

  // for parsing application/json
  app.use(bodyParser.json())
  // for parsing application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use((req, res) => {
    // 读取 apiMap 并解析
    let newApiMap
    try {
      newApiMap = require(apiMapFile)
    } catch (e) {
      newApiMap = []
    }

    if (newApiMap !== apiMap) {
      apiMap = newApiMap
      parseApiMap(apiMap)
    }

    // 获取 mock 数据模块路径
    let modulePath = resolveMockPath(req, baseDir, apiMap),
      module

    try {
      module = require(modulePath)

      if (typeof module === 'function') {
        module = module(req)
      }

      Promise.resolve(module).then(module => {
        res.json(module)
        console.log(chalk.green(`200: ${req.originalUrl} -> ${modulePath} ${new Date().toLocaleTimeString()}`))
      }).catch(e => {
        let code // 代码执行到这里，code 应该是 4xx，5xx 系列
        switch (typeof e) {
          case 'number':
            code = e
            break

          case 'object':
            code = e === null ? 500 : (+e.code || 500)
            break

          default:
            code = 500
        }

        if (code < 400 || code >= 600) {
          code = 500
        }

        res.status(code).json(e)
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
