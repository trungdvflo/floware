/* eslint-disable no-console */
const { Consumer } = require('sqs-consumer');
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');
const { stripHtml } = require('string-strip-html');

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
  try {
    await AwsSystemParameterStore.Init();
    console.log('** Start worker of Aws SQS_URL_DOVECOT_NEW_MAIL... ');
    const AwsConstant = require('./supports/AwsConstant');
    const ApplePushNotifyFloMail = require('../projects/default/services/ApplePushNotifyFloMail');
    const Graylog = require('./supports/utilities/GrayLog');
    const Model = require('./supports/model');
    const GetMessagesID = require('./supports/utilities/Imap');
    const AppConstant = require('./supports/AppConstant');
    const Utils = require('./supports/utilities/Accounts');
    const Re2 = require('re2');

    const app = Consumer.create({
      queueUrl: AwsConstant.SQS_URL_DOVECOT_NEW_MAIL,
      handleMessage: async (message) => {
        try {
          const messageObject = JSON.parse(message.Body);
          if (messageObject.folder?.toUpperCase() !== 'INBOX') {
            return false;
          }
          //
          if (messageObject.event_name === 'MessageNew'
            || messageObject.event_name === 'MessageAppend') {
            Graylog.SendLog('user message', {
              // _user: messageObject.user
            });
            const userInfo = await Model.user.findOne({
              attributes: ['id', 'username'],
              where: { username: messageObject.user },
              raw: true
            });
            if (_.isNull(userInfo)) {
              return false;
            }
            const deviceToken = await Model.device_token.findAll({
              where: {
                username: userInfo.username,
                cert_env: AppConstant.PUSH_NOTIFY_MAIL_OR_SILENT_CERT_ENV
              },
              raw: true
            });
            Graylog.SendLog('deviceToken message', {
              // deviceToken
            });
            const devicePush = {};
            if (deviceToken.length > 0) {
              const listDevices = {};
              deviceToken.map((i) => {
                listDevices[`${i.device_type}${i.cert_env}`] = [];
                return null;
              });
              deviceToken.map((i) => {
                listDevices[`${i.device_type}${i.cert_env}`].push(i.device_token);
                return null;
              });
              devicePush[`${userInfo.id}`] = listDevices;
            }
            const password = Utils.DecryptStringWithRsaPrivateKey(userInfo.rsa);
            const messsageIdEmail = password !== false ? await GetMessagesID(messageObject.user, password, messageObject.uid) : false;

            let snippet = '';
            if (messageObject.snippet) {
              snippet = stripHtml(messageObject.snippet).result;
              // remove spaces
              snippet = snippet.replace(/\s\s+/g, '');
              // remove link http
              snippet = snippet.replace(/\((http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)\)/g, '');
              snippet = snippet.replace(/<(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)>/g, '');
              // remove comments
              snippet = snippet.replace(new Re2(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm), '');
              snippet = snippet.replace(/>/g, '');
            }

            const emailInfo = {
              from: messageObject.from,
              to: messageObject.to,
              subject: messageObject.subject,
              dateSent: messageObject.date,
              snippet,
              uid: messageObject.uid,
              messageID: messsageIdEmail || `${messageObject.uid}`,
              folderName: messageObject.folder || 'INBOX'
            };
            Graylog.SendLog('devicePush message', {
              // emailInfo,
              // devicePush
            });
            await AsyncForEach(devicePush, async (i) => {
              _.forEach(AwsConstant.KEY_MAP_PUSH_NOTIFY, (x, y) => {
                if (i[y]) {
                  ApplePushNotifyFloMail.ApnFloMail(
                    messageObject.user,
                    emailInfo,
                    i[y],
                    y,
                    x,
                    Graylog
                  );
                  // eslint-disable-next-line no-console
                  console.log('** Push Success', messageObject.user);
                }
              });
            });

            Graylog.SendLog('Flomail Push Success: AwsDovecotNewEmail', {
              // messageObject,
              // devicePush
            });
          }
        } catch (error) {
          Graylog.SendLog('DovecotNewMail err', {
            code: error.code,
            // message: error.message,
          });
          return false;
        }
        return true;
      }
    });

    app.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error(err.message);
    });

    app.on('processing_error', (err) => {
      // eslint-disable-next-line no-console
      console.error(err.message);
    });
    // Set max listener to avoid leak memory
    app.setMaxListeners(0);
    app.start();
  } catch (error) {
    const Graylog = require('./supports/utilities/GrayLog');
    Graylog.SendLog('DovecotNewMail catch error', {
      code: error.code,
      // message: error.message,
    });
  }
})();
