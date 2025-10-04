/* eslint-disable no-param-reassign */
const _ = require('lodash');
const Stream = require('stream');
const log = require('gelf-pro');
const CircularJSON = require('circular-json');
const LogsUtili = require('../Logs');

class GoodHapiGraylog extends Stream.Writable {
  constructor({ host, port, facility, adapter = 'udp' }) {
    super({
      objectMode: true, decodeStrings: false 
    });
    this.once('finish', () => {
      this.write();
    });

    this.log = log.setConfig({
      fields: {
        facility 
      },
      adapterName: adapter,
      transform: [
        (rawLog) => { // unwind an error   
          const message = _.get(rawLog, 'short_message', '{}');
          const { tags, event, statusCode, errorMessage } = message;

          const path = _.get(message, 'path', '');
          const method = _.get(message, 'method', '');

          let result;
          switch (event) {
            case 'error': {
              result = LogsUtili.Filter(message, `[Exception]${statusCode ? `[${statusCode}]` : ''} ${message.error.name}`);
              break;
            }
            case 'response': {
              result = LogsUtili.Filter(message, `${statusCode ? `[${statusCode}]` : ''}${method ? `[${message.method.toUpperCase()}]` : ''} Response for ${process.env.BASE_URL}${path}`);
              break;
            }
            default: {
              if (_.isEmpty(tags) === false && tags.indexOf('SystemErrorTracking') >= 0) {
                result = LogsUtili.Filter(message, `[Exception]${statusCode ? `[${statusCode}]` : ''} ${process.env.BASE_URL}${path} : ${errorMessage || ''}`);
                break;
              }
              result = LogsUtili.Filter(message, `Log event for tags: ${CircularJSON.stringify(message.tags)}`);
              break;
            }
          }

          rawLog.short_message = result.short_message;
          // rawLog.full_message = _.get(result, 'extra.full_message', {
          // });
          return CircularJSON.stringify(rawLog);
        }
      ],
      adapterOptions: {
        host,
        port
      }
    });
  }

  _write(data, encoding, callback) {
    try {
      if (_.get(data, 'short_message.config.suppressResponseEvent', false) === false) {
        _.unset(data, 'requestPayload.file');
      }

      this.log.info(data);
      callback();
    } catch (error) {
      // this.log.info( CircularJSON.stringify(error));
    }
  }
}

module.exports = GoodHapiGraylog;
