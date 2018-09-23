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
    if (item[0] === reqPath) {
      return item[1]
    }
  }

  return path.join(baseDir, reqPath)
}

/**
 * @param {number} port 端口号
 * @param {string} baseDir api 请求挂载目录
 * @param {string} apiMapFile api 映射文件，非必传
 */
module.exports = (port, baseDir, apiMapFile) => {
  // 检查 baseDir 是否是个文件夹，apiMapFile 是否是一个文件。
  try {
    if (!fs.statSync(baseDir).isDirectory()) {
      throw new Error()
    }
  } catch (e) {
    console.log(chalk.red(`${baseDir} is not a directory.`))
    process.exit()
  }
  
  try {
    if (apiMapFile && !fs.statSync(apiMapFile).isFile()) {
      throw new Error()
    }
  } catch (e) {
    console.log(chalk.red(`${apiMapFile} is not a file.`))
    process.exit()
  }

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

  const app = new express()

  app.use((req, res) => {
    let apiMap
    try {
      apiMap = require(apiMapFile)
    } catch (e) {
      apiMap = []
    }

    let modulePath = resloveModulePath(req.path, baseDir, apiMap)
    try {
      let module = require(modulePath)

      if (typeof module === 'function') {
        module = module(req)
      }

      Promise.resolve(module).then(module => {
        res.json(module)
        console.log(chalk.green(`200: ${req.path} -> ${modulePath}`))
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
        console.log(chalk.red.bold(`${code}: ${req.path}`))
      })
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        res.sendStatus(404)
        console.log(chalk.red(`404: ${req.path}`))
      } else {
        res.sendStatus(500)
        console.log(chalk.red.bold(`500: ${req.path}`))
        // 这里的错误是 mock 模块中的代码错误，需要打印出来，方便开发者修改。
        console.log(e)
      }
    }
  })

  const server = app.listen(port, function() {
    console.log(chalk.blue(`mock server is listening at ${port}`))
    console.log(chalk.blue(`base directory: ${baseDir}`))
    apiMapFile && console.log(chalk.blue(`api map file: ${apiMapFile}`))
  })

  server.on('close', () => {
    baseDirWatcher.close()
    mapFileWather && mapFileWather.close()
    console.log(chalk.blue(`mock server at ${port} closed`))
  })

  return server
}
