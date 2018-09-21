#!/usr/bin/env node

const Server = require('../lib/server'),
  path = require('path'),
  program = require('commander'),
  pkg = require('../package'),
  chalk = require('chalk')

program.version(pkg.version, '-v, --version')
  .option('--port <port>', 'mock 服务器要监听的端口。', Number, 9999)
  .option('--base-dir <path>', 'api 请求的挂载目录，也就是 mock 数据文件的根目录，默认为当前执行命令的目录。')
  .option('--map-file <path>', 'api 映射文件。')
  .parse(process.argv)

const cwd = process.cwd(),
  baseDir = path.resolve(cwd, program.baseDir || ''),
  apiMapFile = program.mapFile ? path.resolve(cwd, program.mapFile) : ''

Server(program.port, baseDir, apiMapFile)

// https://nodejs.org/api/process.html#process_signal_events
process.on('SIGINT', () => {
  console.log()
  console.log(chalk.blue(`Mock server at ${program.port} closed`))
  // 直接退出进程，而不在 server.close() 的回调中退出，是因为服务器关闭需要很长时间。
  process.exit()
})
