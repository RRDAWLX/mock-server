#!/usr/bin/env node

const Server = require('../lib/server'),
  path = require('path'),
  fs = require('fs'),
  program = require('commander'),
  pkg = require('../package'),
  chalk = require('chalk')

program.version(pkg.version, '-v, --version')
  .option('--port <port>', 'mock 服务器要监听的端口。', Number, 9999)   // 9 is a lucky number
  .option('--base-dir <path>', 'api 请求的挂载目录，也就是 mock 数据文件的根目录，默认为当前执行命令的目录。')
  .option('--map-file <path>', 'api 映射文件。')
  .option('--https', '是否开启 https，默认不开启。')
  .option('--https-options <path>', 'https options 配置文件，格式要求是个 node 模块，返回值是一个对象。')
  .parse(process.argv)

let cwd = process.cwd(),
  baseDir = path.resolve(cwd, program.baseDir || ''),
  apiMapFile = program.mapFile ? path.resolve(cwd, program.mapFile) : '',
  httpsOpts

if (program.https) {
  httpsOpts = {
    cert: fs.readFileSync(path.join(__dirname, '../ca/server.crt')),
    key: fs.readFileSync(path.join(__dirname, '../ca/server.key'))
  }

  if (program.httpsOptions) {
    Object.assign(httpsOpts, require(path.resolve(cwd, program.httpsOptions)))
  }
}

Server({
  port:program.port,
  baseDir,
  apiMapFile,
  httpsOpts
})

// https://nodejs.org/api/process.html#process_signal_events
process.on('SIGINT', () => {
  console.log()
  console.log(chalk.blue(`mock server at ${httpsOpts ? 'https' : 'http'}://localhost:${program.port} closed`))
  // 直接退出进程，而不在 server.close() 的回调中退出，是因为服务器关闭需要很长时间。
  process.exit()
})
