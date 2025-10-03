/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint no-useless-escape: 0 */
const nodemailer = require('nodemailer');
const _ = require('lodash');
const {
  APIError
} = require('../utilities/errors');
const {
  convertSmtpError
} = require('../utilities/smtp-errors');
const {
  getMailerPayload
} = require('../utilities/MessageUtils');

const MAX_RETRIES = 1;

class SendmailClient {
  constructor(account, smtpConfig) {
    this._smtpConfig = smtpConfig;
    this._transporter = nodemailer.createTransport({
      ...this._smtpConfig,
      secure: true,
      requireTLS: true,
      secured: true
    });
    this.user_id = account.user_id || account.id;
  }

  async _send(msgData) {
    let error;
    const messageData = _.clone(msgData);
    // disable node mailer's automatic X-Mailer header
    messageData.xMailer = false;
    let results;
    for (let i = 0; i <= MAX_RETRIES; i += 1) {
      try {
        results = await this._transporter.sendMail(msgData);
        await this._transporter.close();
      } catch (err) {
        error = convertSmtpError(err, {
          connectionSettings: this._smtpConfig
        });
      }

      if (!results) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const {
        rejected,
        pending
      } = results;
      if ((rejected && rejected.length > 0) || (pending && pending.length > 0)) {
        return {
          code: 0,
          message: 'Sending to at least one recipient failed'
        };
      }
      return {
        code: 1,
        data: results
      };
    }

    let userMessage = 'Sending failed';
    let statusCode = 500;
    if (error && error.userMessage && error.statusCode) {
      userMessage = `Sending failed - ${error.userMessage}`;
      statusCode = error.statusCode;
    }

    const {
      host,
      port,
      secure
    } = this._transporter.transporter.options;
    await this._transporter.close();
    throw new APIError(userMessage, statusCode, {
      originalError: error,
      smtp_host: host,
      smtp_port: port,
      smtp_use_ssl: secure
    });
  }

  async Send(message) {
    const payload = getMailerPayload(message);
    const result = await this._send(payload);
    return result;
  }
}

module.exports = SendmailClient;
