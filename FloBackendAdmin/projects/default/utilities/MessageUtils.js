/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const {
  FindPath
} = require('./Utils');
const {
  APIError
} = require('./errors');
const {
  PATH_UPLOAD
} = require('../constants/AppsConstant');

const formatParticipants = (participants) => {
  return participants.map((p) => `${p.name.replace('@', ' ')} <${p.address}>`).join(',');
};

// Transforms the message into a json object with the properties formatted in
// the way mailer libraries (e.g. nodemailer, mailcomposer) expect.
function getMailerPayload(message) {
  const msgData = {};
  for (const field of ['from', 'to', 'cc', 'bcc']) {
    if (message[field]) {
      msgData[field] = formatParticipants(message[field]);
    }
  }

  msgData.date = message.date;
  msgData.subject = message.subject;
  msgData.html = message.html;
  msgData.text = message.text;
  msgData.messageId = message.headerMessageId || message.message_id_header;
  msgData.attachments = [];

  const uploads = message.attachments || [];
  for (const upload of uploads) {
    // const targetPath = fileUtil.GetFileLocation('', message.userId, pathUtil.join('upload', message.attId, upload.fileUuid, upload.name));
    const targetPath = FindPath({
      userId: message.userId,
      pathUpload: PATH_UPLOAD,
      fileUuid: upload.fileUuid,
      filename: upload.name
    });

    if (!fs.existsSync(targetPath)) {
      throw new APIError('Bad Request', 400, {
        path: targetPath
      });
    }

    msgData.attachments.push({
      filename: upload.name,
      content: fs.createReadStream(targetPath)
    });
  }

  if (message.replyTo) {
    msgData.replyTo = formatParticipants(message.replyTo);
  }

  msgData.inReplyTo = message.inReplyTo;
  msgData.references = message.references;
  msgData.headers = message.headers || {};
  msgData.headers['User-Agent'] = 'FloDomail';

  return msgData;
}

module.exports = {
  getMailerPayload
};
