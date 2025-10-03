/* eslint-disable no-useless-catch */
const {
  htmlToText
} = require('html-to-text');
const Cheerio = require('cheerio');
const _ = require('lodash');
const ExpressUserAgent = require('express-useragent');
const Fs = require('fs');
const Code = require('../constants/ResponseCodeConstant');
const Futil = require('../utilities/Futil');
const EmailService = require('../services/EmailService');
const ImapService = require('../services/ImapService');
const SendMailClientService = require('../services/SendMailClientService');
const HandleUpload = require('../utilities/UploadLocalFile');

const {
  SYSTEM_ADMIN_ADDRESSES,
  SYSTEM_ADMIN_ADDRESSES_BCC,
  SMTP_SERVER,
  SMTP_PORT,
  IMAP_SERVER,
  IMAP_PORT,
  PATH_UPLOAD,
  MAX_FEEDBACK_CONTENT_LENGTH
} = require('../constants/AppsConstant');
const { UserModel } = require('../models');

const Private = {
  removeAttachment: (attachments) => {
    if (_.isEmpty(attachments) === true) {
      return true;
    }
    _.forEach(attachments, (attachment) => {
      Fs.unlinkSync(attachment.path);
    });
    return true;
  }
};
module.exports.SendFeedBack = async (request, h) => {
  try {
    const {
      payload,
      headers
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    const { rsa } = await UserModel.findOne({
      attributes: ['rsa'],
      where: {
        id: userInfo.user_id
      },
      raw: true
    });

    if (_.isEmpty(rsa) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['No account password']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const message = {
      attId: payload.attId,
      subject: payload.subject,
      from: [{
        name: userInfo.email.split('@')[0],
        address: userInfo.email
      }],
      to: SYSTEM_ADMIN_ADDRESSES,
      bcc: SYSTEM_ADMIN_ADDRESSES_BCC || [],
      userId: userInfo.user_id,
      attachments: payload.attachments
    };

    const attachments = await EmailService.ProcessMessageAttachments(message, request);
    if (attachments.code === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: [attachments.message]
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }
    const htmlDoc = Cheerio.load(payload.html || '');
    const userAgent = ExpressUserAgent.parse(headers['user-agent']);
    const htmlElement = `<br/><br/><div>User Info <br/>Email address: ${userInfo.email}<br/>
          Browser: ${userAgent.browser} ${userAgent.version}<br/>
          Operating System: ${userAgent.os}<br/>
          Datetime: ${new Date()}<br/>
          Domain: ${headers.origin || 'unknown'}
          </div>`;
    message.html = htmlDoc('body').append(htmlElement).html();
    const processedASEmail = EmailService.ProcessActionScripts(message);

    message.attachments = attachments.messageAttachments;
    message.html = processedASEmail.html;
    message.text = htmlToText(processedASEmail.html || '', {
      ignoreImage: true,
      wordwrap: null,
      preserveNewlines: true,
      singleNewLineParagraphs: true
    });

    const smtpConfig = {
      host: SMTP_SERVER,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: userInfo.email,
        pass: Futil.Decrypt(rsa)
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    const imapConfig = {
      user: userInfo.email,
      password: Futil.Decrypt(rsa),
      host: IMAP_SERVER,
      port: IMAP_PORT,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      autotls: 'required'
    };
    const html = _.get(message, 'html', '');
    const contentLength = html.length + attachments.contentLength;

    if (contentLength > MAX_FEEDBACK_CONTENT_LENGTH) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Maximum email size exceeded (25MB)']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const sender = new SendMailClientService(userInfo, smtpConfig);
    const sendResult = await sender.Send(message);
    if (sendResult.code === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: [sendResult.message]
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    message.messageId = _.get(sendResult, 'data.messageId', '');
    const imap = new ImapService(imapConfig, userInfo);
    await imap.Connect();
    await imap.StoreMessage(message, 'Sent');
    await imap.End();
    Private.removeAttachment(attachments.messageAttachments);

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Send feedback successfully'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

module.exports.Upload = async (request, h) => {
  try {
    const {
      payload
    } = request;
    const pathUpload = PATH_UPLOAD;
    const allowFileTypes = [
      'jpg', 'jpeg', 'gif', 'png', 'bmp', 'tiff',
      'txt', 'xml', 'csv', 'text', 'rtf', 'rtx', 'etf', 'rt', 'des', 'readme', 'vcf', 'ics', 'vcard', 'json', 'css',
      'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'zip', 'rar', '7z', 'iso', 'ttf',
      'webm', 'mkv', 'x-matroska', 'flv', 'flash', 'vob', 'ogv', 'ogg', 'drc', 'gif', 'gifv',
      'mng', 'avi', 'x-msvideo', 'msvideo', 'mov', 'quicktime', 'qt',
      'wmv', 'x-ms-wmv', 'yuv', 'rm', 'rmvb', 'asf', 'amv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe',
      'mpv', 'm2v', 'm4v', 'svi', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'f4v', 'f4p', 'f4a', 'f4b',
      'aa', 'aac', 'aax', 'act', 'aiff', 'amr', 'ape', 'au', 'awb', 'dct',
      'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'mmf', 'mp3', 'mpeg', 'mpc', 'msv', 'ogg',
      'oga', 'opus', 'ra', 'rm', 'raw', 'sln', 'tta', 'vox', 'wav', 'wave', 'x-wav', 'wma', 'mv', 'webm',
      '7z', 'rar', 'zip', 'iso', 'ttf'
    ];
    const handleUpload = await HandleUpload(payload, pathUpload, allowFileTypes);
    if (handleUpload.status === false) {
      return h.response({
        code: Code.INVALID_DATA,
        error: {
          message: _.get(handleUpload, 'message', 'Uploading file failed! Write a file with errors or a file uploaded with the wrong size')
        }
      }).code(Code.INVALID_DATA);
    }
    if (handleUpload) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: {
          fileName: payload.file.hapi.filename,
          fileUuid: handleUpload.fileUid,
          length: handleUpload.length,
          message: 'Upload file successfully'
        }
      }).code(Code.REQUEST_SUCCESS);
    }
    return h.response({
      code: Code.UPLOADING,
      data: {
        message: 'File upload is in processing'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};
