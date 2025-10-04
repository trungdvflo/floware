/* eslint-disable prefer-spread */
/* eslint-disable no-param-reassign */
const _ = require('lodash');
const Stream = require('stream');
const Raven = require('raven');
const { Filter } = require('../Logs');
const { REQUEST_SUCCESS } = require('../../constants/ResponseCodeConstant');

function GetLevel(tags) {
  if (_.indexOf(tags, 'fatal') >= 0) {
    return 'fatal';
  }
  if (_.indexOf(tags, 'err') >= 0 || _.indexOf(tags, 'error') >= 0) {
    return 'error';
  }

  if (_.indexOf(tags, 'warn') >= 0 || _.indexOf(tags, 'warning') >= 0) {
    return 'warning';
  }
  if (_.indexOf(tags, 'info') >= 0 || _.indexOf(tags, 'Info') >= 0) {
    return 'info';
  }
  return 'debug';
}

function Clone(data) {
  if (_.isObject(data) === true) {
    return JSON.parse(JSON.stringify(data));
  }
  return data;
}

function GetAdditionalData(data, code) {
  const tags = data.tags || ['Info'];
  if (code >= 400 && code < 500) {
    tags.push('warning');
  }
  return {
    level: GetLevel(tags),
    tags,
    extra: {
      event: data.event
    }
  };
}

class GoodHapiSentry extends Stream.Writable {
  constructor({ dsn, name }) {
    super({
      objectMode: true, 
      decodeStrings: false 
    });
    this.once('finish', () => {
      this.write();
    });

    this.log = Raven.config(dsn, {
      serverName: name,
      dataCallback(event) {
        delete event.modules;
        event.message = Filter(event.message);
        return event;
      }

    }).install();
  }

  _write(data, encoding, callback) {
    const code = _.get(data, 'data.response.error.code', REQUEST_SUCCESS);
    const additionalData = GetAdditionalData(data, code);
    if (additionalData.level === 'error') {
      this.log.captureException(data.error, additionalData, () => {
        return callback();
      });
    } else {
      this.log.captureMessage(Clone(data.data), additionalData, () => {
        return callback();
      });
    }
  }
}

module.exports = GoodHapiSentry;

