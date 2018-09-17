#!/usr/bin/env node

const server = require('../lib/server'),
  path = require('path')

const port = 5000,
  baseDir = path.join(__dirname, '../test/mock-files'),
  apiMapFile = path.join(__dirname, '../test/map.js')

console.log('run')

server(port, baseDir, apiMapFile)
