const express = require('express'),
  fs = require('fs'),
  parse = require('url').parse,
  path = require('path'),
  chalk = require('chalk')

const port = 5000,
  baseDir = path.join(__dirname, './test/mock-files'),
  app = new express()

app.use(function (req, res, next) {
  console.log(req.path)

  let modulePath = path.join(baseDir, parse(req.url).pathname)
  try {
    let module = require(modulePath)
    moduleId = module.id

    if (typeof module == 'function') {
      module = module(req)
    }

    res.json(module)

    console.log(require.cache)
    console.log(chalk.red(moduleId))

    //删除缓存，以便mock数据文件被修改后服务器能响应最新的数据。
    delete require.cache[moduleId]
  } catch (e) {
    console.log(e)
    res.sendStatus(404)
  }
})

const server = app.listen(port, function () {
  console.log(`Mock server is listening at ${port}`)
})

server.on('close', () => {
  console.log(`Mock server at ${port} closed`)
})