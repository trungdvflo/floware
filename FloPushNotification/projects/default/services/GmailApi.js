/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const _ = require('lodash');
const { Base64 } = require('js-base64');
const Entities = require('html-entities').AllHtmlEntities;
 
const entities = new Entities();
const SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/pubsub',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly'
];

let EMAIL = '';
let ACCESSTOKEN = '';

const TOKEN_PATH = `${__dirname}/token/`;
// const CREDENTIALS_FILE = `${__dirname}/token/credentials.json`;
const { CREDENTIALS } = process.env;
const PrivateFunc = {
    _ReadCredentials: async () => {
        try {
            // const originalData = await fs.readFileSync(CREDENTIALS_FILE);
            const credentials = JSON.parse(Base64.decode(CREDENTIALS));
            return credentials; 
        } catch (error) {
            // console.log('_ReadCredentials error');
            return false;
        }
    },
    _ReadToken: async () => {
        try {
            const fullPathToken = `${TOKEN_PATH}${EMAIL}.json`;
            const originalData = await fs.readFileSync(fullPathToken);
            const token = JSON.parse(originalData.toString());
            return token;
        } catch (error) {
            // console.log('_ReadToken error');
            return false;
        }
    },
    _GetNewToken: async (oAuth2Client) => {
        try {
            // eslint-disable-next-line no-unused-vars
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES
            });
            // console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return console.error('Error retrieving access token', err);
                    oAuth2Client.setCredentials(token);
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                        if (err) return console.error('TOKEN_PATH err');
                        console.log('Token stored to', TOKEN_PATH);
                        return null;
                    });
                    return oAuth2Client;
                });
            });
            return null;
        } catch (error) {
            console.log('_GetNewToken error');
            return false;
        }
    },
    _Authorize: async () => {
        try {
            const credentials = await PrivateFunc._ReadCredentials();
            const { client_secret, client_id, redirect_uris } = credentials.web;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            
            // const token = await PrivateFunc._ReadToken();
            if (ACCESSTOKEN) { oAuth2Client.setCredentials(ACCESSTOKEN); } else { 
                console.log('_Authorize error');
                return false;
            }
            return oAuth2Client;
        } catch (error) {
            console.log('_Authorize error');
            return false;
        }
    },
    _Init: async () => {
        try {
            const auth = await PrivateFunc._Authorize();
            return google.gmail({ version: 'v1', auth });
        } catch (error) {
            console.log('_Init error');
            return false;
        }
    }
};

module.exports = {
  
    // Get labels 
    ListLabels: async () => {
        try {
            const gmail = await PrivateFunc._Init();
            const res = await gmail.users.labels.list({
                userId: 'me'
            });
            const { labels } = res.data;
            if (labels.length) {
                console.log('Check AccessToken OK');
            } else {
                console.log('No labels found.');
            }
            return labels;
        } catch (error) {
            console.log('Check AccessToken error');
            return false;
        }
    },
    // Register 
    Watch: async () => {
        try {
            const gmail = await PrivateFunc._Init();
            const res = await gmail.users.watch({
                userId: 'me',
                requestBody: {
                    topicName: process.env.TOPIC_NAME,
                    labelIds: [
                        'CATEGORY_UPDATES',
                        'CATEGORY_PROMOTIONS',
                        'CATEGORY_SOCIAL',
                        'CATEGORY_FORUMS',
                        'INBOX',
                        'IMPORTANT'
                    ]
                    // labelFilterAction: 'exclude'
                }
            });
            // console.log('Watch', JSON.stringify(res.data));

            return res.data;
        } catch (error) {
            // console.log('Watch error', JSON.stringify(error));
            return false;
        }
    },

    History: async (startHistoryId) => {
        try {
            const gmail = await PrivateFunc._Init();
            const res = await gmail.users.history.list({ 
                userId: 'me',
                startHistoryId
            });
       
            // console.log('res.data.history', JSON.stringify(res.data));
       
            return res.data.history;
        } catch (error) {
            // console.log('History error', JSON.stringify(error));
            return false;
        }
    },

    GetMessages: async (id) => {
        try {
            const gmail = await PrivateFunc._Init();
            const res = await gmail.users.messages.get({ 
                userId: 'me',
                id,
                format: 'full'
            });
             
            // console.log('*******************************res.data.payload', res.data.payload.headers);
             
            const subject = _.find(res.data.payload.headers, { name: 'Subject' });
            const from = _.find(res.data.payload.headers, { name: 'From' });
            let messageId = _.find(res.data.payload.headers, { name: 'Message-ID' });
            messageId = _.isUndefined(messageId) ? _.find(res.data.payload.headers, { name: 'Message-Id' }) : messageId;
            // Delete character < and >
            let messageIdStr = messageId.value.substr(1);
            messageIdStr = messageIdStr.substring(0, messageIdStr.length - 1);
            
            const emailInfo = {
                subject: entities.decode(subject.value),
                snippet: entities.decode(res.data.snippet),
                from: from.value,
                messageId: messageIdStr,
                uid: res.data.id,
                labelIds: res.data.labelIds
            };
            return emailInfo;
        } catch (error) {
            console.log('GetMessages error', error);
            return false;
        }
    },
    SetEmail: (email) => {
        EMAIL = email;
    },
    SetAccessToken: (token) => {
        ACCESSTOKEN = token;
    }
};
