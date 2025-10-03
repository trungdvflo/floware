global.alog = require('alog-xyz')
  .getInstance({
    mode: process.env.MODE || 'PROD',
    dirpath: __dirname,
    logName: 'FLoDB'
  });

const service = require('./service')
const utils = require('./utils')

module.exports = {
  service, utils
}