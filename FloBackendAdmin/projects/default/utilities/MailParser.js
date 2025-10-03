/* eslint-disable no-restricted-syntax */
/* eslint-disable no-useless-catch */
const { MailParser } = require('mailparser');
const fs = require('fs');
const cheerio = require('cheerio');
const Autolinker = require('autolinker');
const moment = require('moment');
const FileUtil = require('./FileUtil');
      
class Parser {
    constructor() {
        this.parser = new MailParser();
    }

    async parseFullMail(stream, attachmentBasePath) {
        try {
            if (!stream) throw Error('No stream');
            const parsed = new Promise((resolve, reject) => {
                try {
                    const mailObj = {
                        attachments: []
                    };
                    this.parser.on('headers', (headers) => {
                        const headerObj = {};
                        for (const [k, v] of headers) {
                            headerObj[k] = v;
                        }
                        mailObj.headers = headerObj;
                    });

                    this.parser.on('data', (data) => {
                        if (data.type === 'attachment') {
                            if (!attachmentBasePath) {
                                data.release();
                                return;
                            }

                            let {
                                filename, cid 
                            } = data;

                            const {
                                content, contentDisposition, contentType 
                            } = data;

                            if (!cid && !filename) {
                                data.release();
                                return;
                            }
                            if (!cid) cid = `generated_${filename}_${moment().format('YYYYMMDDhhmmss')}`;
                            if (!filename) filename = cid && cid.replace('@', '_');

                            const filePath = FileUtil.createFullAttPath(attachmentBasePath, cid, filename);
                            const url = FileUtil.getUrl(filePath);
                            content.on('end', () => {
                                mailObj.attachments.push({
                                    url,
                                    // path: filePath,
                                    fileName: filename,
                                    cid,
                                    contentDisposition,
                                    contentType
                                });
                                data.release();
                            });

                            const ws = fs.createWriteStream(filePath);

                            content.on('error', () => {
                                ws.close();
                            });
              
                            content.pipe(ws);
                        } else if (data.type === 'text') {
                            mailObj.contents = data;
                        }
                    });

                    this.parser.on('end', () => {
                        let { html } = mailObj.contents;
                        const { text, textAsHtml } = mailObj.contents;
                        const inlineAttachments = mailObj.attachments.filter((att) => att.contentDisposition === 'inline');

                        if (html) {
                            const $ = cheerio.load(html);
                            inlineAttachments.forEach((inlineAttachment) => {
                                const contentId = `img[src="cid:${inlineAttachment.cid}"]`;
                                const inlineImage = $(contentId);
                                inlineImage.attr('src', inlineAttachment.url);
                                // html = $('body').html();
                            });
                            $('script,style,noscript').remove();
                            html = $.html();
                            html = Autolinker.link(html);
                        }
                        mailObj.contents = { text, html, textAsHtml };
                        resolve(mailObj);
                    });

                    stream.pipe(this.parser);
                } catch (err) {
                    throw err;
                }
            });
            return parsed;
        } catch (err) {
            throw err;
        }
    }

    async parseMail(stream) {
        try {
            if (!stream) throw Error('No stream');
            const parsed = new Promise((resolve, reject) => {
                try {
                    const mailObj = {
                        attachments: []
                    };
                    this.parser.on('headers', (headers) => {
                        const headerObj = {};
                        for (const [k, v] of headers) {
                            // We don’t escape the key '__proto__'
                            // which can cause problems on older engines
                            headerObj[k] = v;
                        }
                        mailObj.headerObj = headerObj;
                    });

                    this.parser.on('data', (data) => {
                        if (data.type === 'attachment') {
                            mailObj.attachments.push(data);
                            data.content.on('readable', () => data.content.read());
                            data.content.on('end', () => data.release());
                        } else if (data.type === 'text') {
                            mailObj.text = data;
                        }
                    });

                    this.parser.on('end', () => {
                        resolve(mailObj);
                    });

                    stream.pipe(this.parser);
                } catch (err) {
                    reject(err);
                }
            });
            return await parsed;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = () => {
    return new Parser();
};
