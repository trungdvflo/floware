/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-shadow */
/* eslint-disable no-return-await */
/* eslint-disable no-useless-catch */
/* eslint-disable no-underscore-dangle */
const Imap = require('imap');
const fs = require('fs');
const _ = require('lodash');
const Parsers = require('../utilities/Parsers');
const MailParser = require('../utilities/MailParser');
const EmailUtils = require('../utilities/EmailUtils');
const Mailcomposer = require('../libs/mailcomposer/lib/mailcomposer');
const { FindPath } = require('../utilities/Utils');
const {
    PATH_UPLOAD
} = require('../constants/AppsConstant');

function CreateStoreMessage(user, msg) {
    return new Promise((resolve, reject) => {
        if (!_.isObject(msg)) {            
            reject(new Error('invalid email object'));
        } else {
            // validate the message if it isn't a draft
            let error = false;
            if (!msg.draft) {
                if (_.isEmpty(msg.to) && _.isEmpty(msg.cc) && _.isEmpty(msg.bcc)) {
                    reject(new Error('no recipients'));
                    error = true;
                } else if (!msg.subject) {
                    reject(new Error('no subject'));
                    error = true;
                }
            }
           
            if (error === false) {
                const uniq = (adds) => {
                    return _.uniq(adds, (a) => {
                        return a.address;
                    });
                };

                // TODO should create another file when store the message to another place
                const message = {
                    inReplyTo: msg.inReplyTo,
                    references: msg.references,
                    messageId: msg.messageId,
                    subject: msg.subject,
                    from: Parsers.parseFrom(msg, user),
                    to: uniq(msg.to),
                    cc: uniq(msg.cc),
                    bcc: uniq(msg.bcc),
                    text: msg.text || '',
                    html: msg.html || '',
                    attachments: [],
                    date: msg.date ? new Date(msg.date) : new Date(),
                    receivedDate: msg.receivedDate ? new Date(msg.receivedDate) : new Date()
                };
                // handle the message's attachments
                if (!_.isEmpty(msg.attachments)) {
                    msg.attachments.forEach((a) => {
                        let storePath = '';
                        try {
                            storePath = FindPath({
                                attId: msg.attId,
                                pathUpload: PATH_UPLOAD,
                                fileUuid: a.fileUuid,
                                filename: a.name || a.filename || a.fileName || a.generatedFileName
                            });
                        } catch (err) {                            
                            reject(err);
                            storePath = '';
                        }
                        
                        if (storePath && fs.existsSync(storePath)) {
                            message.attachments.push({
                                contentType: a.contentType,
                                contentDisposition: a.contentDisposition,
                                transferEncoding: a.transferEncoding,
                                contentId: a.contentId,
                                filename: a.fileName || a.filename || a.name,
                                generatedFileName: a.name || a.filename || a.fileName || a.generatedFileName,
                                path: storePath
                            });
                        }
                    });
                }
                
                resolve(message);
            }
            resolve(false);
        }
    });
}

class ImapService {
    constructor(imapInfo, user) {
        if (!imapInfo) throw Error('No imap config');
        this.imap = new Imap(imapInfo);        
        this.user = user;
    }

    async Connect() {
        return new Promise((resolve, reject) => {
            this.imap.on('ready', () => {                
                resolve(this.imap);
            });

            this.imap.on('error', (err) => {
                reject(err);
            });

            this.imap.connect();
        });
    }

    async End() {
        return new Promise((resolve, reject) => {
            this.imap.on('end', () => {
                resolve();
            });

            this.imap.on('close', () => {
                resolve();
            });

            this.imap.on('error', (err) => {
                reject(err);
            });

            this.imap.end();
        });
    }

    //
    // /////////////////////////////////////////////////
    // Old functions 

    async StoreMessage(msg, path) {
        try {
            if (!path) throw new Error('invalid path');
            if (!_.isObject(msg)) throw new Error('invalid message');
            const storeMessage = await CreateStoreMessage(this.user, msg);
            
            // build the rfc 822 message
            // eslint-disable-next-line no-async-promise-executor
            const result = await new Promise(async (resolve, reject) => {
                Mailcomposer(storeMessage).build((err, raw) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.imap.append(raw, {
                            mailbox: path,
                            flags: ['\\Seen'],
                            date: storeMessage.date ? new Date(storeMessage.date) : new Date()
                        }, async (err, uid) => {
                            if (err) {
                                reject(err);
                            } else {
                                storeMessage.uid = uid;
                                storeMessage.path = path;
                                storeMessage.flags = storeMessage.flags ? storeMessage.flags.concat(['\\Seen']) : ['\\Seen'];
        
                                if (storeMessage.from && !_.isArray(storeMessage.from)) {
                                    storeMessage.from = [{ address: storeMessage.from }];
                                }
        
                                try {
                                    await this.OpenBox(path, true);
                                    const data = await this.FetchHeaders([uid], path);
                                    storeMessage.attributes = data[0].attributes;
                                    storeMessage.headers = data[0].headers;                                    
                                    Parsers.addMsgProps(storeMessage, this.user);
                                    resolve(storeMessage);
                                } catch (err) {                                    
                                    reject(err);
                                }
                            }
                        });
                    }
                });
            });
                  
            return result;
        } catch (err) {
            throw err;
        }
    }

    //
    // /////////////////////////////////////////////////
    // Private methods

    async OpenBox(path, isReadOnly = false) {
        return new Promise((resolve, reject) => {
            this.imap.openBox(path, isReadOnly, (err, box) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(box);
                }
            });
        });
    }

    async CloseBox() {
        return new Promise((resolve, reject) => {
            this.imap.closeBox((err) => { 
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // similar to fetchMessages but only return the header information (no paging or body)
    async FetchHeaders(uids, path) {
        return new Promise((resolve, reject) => {
            const promises = [];

            if (!uids) uids = '1:*';

            const fetch = this.imap.fetch(uids, {
                bodies: 'HEADER', struct: true
            });

            fetch.on('message', (msg, seqno) => {
                const pm = new Promise((resolve, reject) => {
                    const data = {};

                    msg.once('attributes', (attr) => {
                        data.uid = attr.uid;
                        data.path = path;
                        data.attributes = attr;
                    });

                    msg.on('body', async (stream) => {
                        // stream.pipe(parser);
                        try {
                            const mailParser = MailParser();
                            const results = await mailParser.parseMail(stream);
                            const { headerObj } = results;
                            let {
                                to, from, cc, bcc, references 
                            } = headerObj;

                            const { subject, date } = headerObj;
                            
                            to = to && to.value;
                            from = from && from.value;
                            cc = cc && cc.value;
                            bcc = bcc && bcc.value;
                            headerObj['message-id'] = headerObj['message-id'] && EmailUtils.trimQuotes(headerObj['message-id']);
                            references = references && (Array.isArray(references) ? references : [references]);
                            references = references && references.map((ref) => EmailUtils.trimQuotes(ref));
                            const { uid, path, attributes } = data;
                            _.extend(data, headerObj);
                            resolve({
                                to,
                                from,
                                cc,
                                bcc,
                                subject,
                                date,
                                uid,
                                path,
                                attributes,
                                references,
                                messageId: headerObj['message-id'],
                                contentType: headerObj['content-type']
                            });
                        } catch (err) {                            
                            reject(err);
                        }
                    });
                });
                promises.push(pm);
            });

            fetch.on('end', async () => {
                const data = await Promise.all(promises);
                resolve(data);
            });

            fetch.on('error', (err) => {
                reject(err);
            });
        });
    }
}

module.exports = ImapService;
