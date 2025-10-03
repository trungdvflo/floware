/* eslint-disable block-scoped-var */
/* eslint-disable no-buffer-constructor */
/* eslint-disable no-useless-escape */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-cond-assign */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
const _ = require('lodash');
const Mimelib = require('mimelib');
const mime = require('mime');
const crypto = require('crypto');
const cheerio = require('cheerio');
const Futil = require('./Futil');
const AppsConstant = require('../constants/AppsConstant');
const validator = require('validator');
const Re2 = require('re2');

function sanitizeHtml(msg) {
    msg.html = msg.html.replace(Re2(/<(style|script).*>[\s\S]*<\/(style|script)>/g), '');
}

function isASCII(str) {
    // eslint-disable-next-line no-control-regex
    return /^[\x00-\x7F]*$/.test(str);
}

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing; }

function encode(str) {
    const b = Buffer.from(`${str.length * 2}`); // removed encoding specifier (ascii)
    for (let i = 0, bi = 0; i < str.length; i++) {
        // Note that we can't simply convert a UTF-8 string to Base64 because
        // UTF-8 uses a different encoding. In modified UTF-7, all characters
        // are represented by their two byte Unicode ID.
        const c = str.charCodeAt(i);
        // Upper 8 bits shifted into lower 8 bits so that they fit into 1 byte.
        b[bi++] = c >> 8;
        // Lower 8 bits. Cut off the upper 8 bits so that they fit into 1 byte.
        b[bi++] = c & 0xFF;
    }
    // Modified Base64 uses , instead of / and omits trailing =.
    return b.toString('base64').replace(Re2(/=+$/), '');
}
// RFC 3501, section 5.1.3 UTF-7 encoding.
function imapEncode(str) {
    // All printable ASCII chars except for & must be represented by themselves.
    // We replace subsequent non-representable chars with their escape sequence.
    return str.replace(/&/g, '&-').replace(/[^\x20-\x7e]+/g, (chunk) => {
        // & is represented by an empty sequence &-, otherwise call encode().
        chunk = (chunk === '&' ? '' : encode(chunk)).replace(/\//g, ',');
        return `&${chunk}-`;
    });
}

function findAttachmentParts(struct, attachments) {
    attachments = attachments || [];
    for (var i = 0, len = struct.length, r; i < len; ++i) {
        if (Array.isArray(struct[i])) {
            findAttachmentParts(struct[i], attachments);
        } else if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
            attachments.push(struct[i]);
        }
    }
    return attachments;
}

function convertToHtmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const trimQuotes = (value) => {
    value = (value || '').trim();
    if ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"')
        || (value.charAt(0) === '\'' && value.charAt(value.length - 1) === '\'')
        || (value.charAt(0) === '<' && value.charAt(value.length - 1) === '>')) {
        value = value.substr(1, value.length - 2);
    }
    return value;
};

function trimContent(m) {
    m.html = m.html ? m.html.trim() : '';
    m.text = m.text ? m.text.trim() : '';
    m.subject = m.subject ? m.subject.trim() : '';
}

function fillReplyHtml(msg) {
    if (msg.inReplyTo && !msg.html && msg.text) {
        const lines = msg.text.split('\n');
        if (lines.length === 1) return;

        // check if this message can be formatted
        let formatable = false;
        let i;
        for (i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('>') === 0) {
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].indexOf('>') === 0) {
                        formatable = true;
                    } else {
                        formatable = false;
                    }
                }
                break;
            }
        }
        if (!formatable) return;

        // split "lines" into 2 separate arrays
        // one without ">" at the beginning and one with (quotes)
        const quotes = lines.splice(i);

        // return the new text of the replied message
        const newHtml = lines.map((l) => {
            return l ? `<div>${l}</div>` : '<br>';
        });

        // return the quoted part of the replied message
        // eslint-disable-next-line no-shadow
        var addBlock = (quotes) => {
            if (quotes.length === 0) return [];

            const els = [];
            // eslint-disable-next-line no-shadow
            let i;

            // strip ">"
            for (i = 0; i < quotes.length; i++) {
                quotes[i] = quotes[i].slice(1);
            }

            els.unshift('<blockquote>');

            for (i = 0; i < quotes.length; i++) {
                if (!quotes[i][0]) {
                    // eslint-disable-next-line no-continue
                    continue;
                } else if (quotes[i][0] !== '>') {
                    const tmp = quotes[i].trim();
                    if (tmp) {
                        els.push(`<div>${quotes[i]}</div>`);
                    } else {
                        els.push('<br>');
                    }
                } else {
                    addBlock(quotes.slice(i, quotes.length - 1))
                        .forEach((n) => {
                            els.push(n);
                        });
                    break;
                }
            }

            els.push('</blockquote>');

            return els;
        };
        const quotedHtml = addBlock(quotes);

        // concat both of them then assign to html
        msg.html = newHtml.concat(quotedHtml).join('');
    }
}

// /**
// * Copy text to html if it's empty.
// */
function fillEmptyHtml(msg) {
    if (!msg.html) {
        msg.html = msg.text ? msg.text.replace(/\n/g, '<br>') : '';
    }
}

function generateFileNamev2(_fileNames, fileName, contentType) {
    let ext;
    let defaultExt = '';

    if (contentType) {
        defaultExt = mime.extension(contentType);
        defaultExt = defaultExt ? `.${defaultExt}` : '';
    }
    fileName = fileName || `attachment${defaultExt}`;

    // remove path if it is included in the filename
    fileName = fileName.toString().split(/[\/\\]+/).pop().replace(/^\.+/, '') || 'attachment';
    const fileRootName = fileName.replace(/(?:\-\d+)+(\.[^.]*)$/, '$1') || 'attachment';
    if (fileRootName in _fileNames) {
        _fileNames[fileRootName]++;
        ext = fileName.substr((fileName.lastIndexOf('.') || 0) + 1);
        if (ext === fileName) {
            fileName += `-${_fileNames[fileRootName]}`;
        } else {
            fileName = `${fileName.substr(0, fileName.length - ext.length - 1)}-${_fileNames[fileRootName]}.${ext}`;
        }
    } else {
        _fileNames[fileRootName] = 0;
    }

    return fileName;
}

function encodeFolderNames(folders) {
    _.each(folders, (value, key) => {
        value.displayName = key;
        if (!isASCII(key)) {
            const path = imapEncode(key);
            value.path = path;
        } else {
            value.path = key;
        }

        if (value.children) encodeFolderNames(value.children);
    });
}

function processActionScripts(msg) {
    if (msg.html) {
        var $ = cheerio.load(msg.html);
        $('script,noscript,style').remove();
        msg.html = $('body').html();
    }
    if (msg.text) {
        // remove html part
        // eslint-disable-next-line no-redeclare
        var $ = cheerio.load(msg.text);
        $('script,noscript,style').remove();
        // msg.text = replaceHtmlEntites(msg.text)
        // .replace(/(<br\\*>)\1*|\n\n*/g, ' ')
        // .replace(/<[^>]*>|[\->]/g, '')
        // .replace(/\s\s+/g, ' ');
        msg.text = $('body').text();
        msg.text = convertToHtmlEntities(msg.text);
    }
}

function processDoubleQuotes(rfc822Addresses) {
    return _.map(rfc822Addresses, (rfc822Address) => {
        if (rfc822Address.name && rfc822Address.name.charAt(0) === '"' && rfc822Address.name.charAt(rfc822Address.name.length - 1) === '"') {
            rfc822Address.name = rfc822Address.name.substr(1, rfc822Address.name.length - 2);
        }
        return { address: (rfc822Address.address || '').toLowerCase(), name: rfc822Address.name };
    });
}

function processRawAttachmentParts(msg) {
    if (_.isEmpty(msg.attributes)) return;
    const attachments = findAttachmentParts((msg.attributes || {}).struct);
    if (_.isEmpty(attachments)) return;
    const _fileNames = {};
    if (_.isEmpty(attachments) && !_.isEmpty(msg.attachments)) {
        return;
    }
    msg.attachments = [];
    msg.inlineAttachments = [];
    attachments.forEach((att) => {
        att.fileName = ((att.disposition || {}).params || {}).filename || ((att.params || {}).name);
        att.fileName = replaceMimeWords(att.fileName || 'attachment');
        att.generatedFileName = generateFileNamev2(_fileNames, ((att.disposition || {}).params || {}).filename || ((att.params || {}).name));
        att.contentId = trimQuotes(att.id) || `${crypto.createHash('md5').update(new Buffer(att.generatedFileName, 'utf-8')).digest('hex')}@mailparser`;
        att.length = att.size;
        if (att.disposition && ['INLINE'].indexOf(toUpper(att.disposition.type)) > -1 && att.subtype !== 'tiff') {
            msg.inlineAttachments.push(att);
        } else {
            msg.attachments.push(att);
        }
    });
}

const addMsgProps = (msg, user) => {
    msg.account = user.account;
    msg.accountId = user.accountId;
    msg.accountType = user.accountType;
    msg.itemType = AppsConstant.EMAIL_TYPE;
    processActionScripts(msg);
    trimContent(msg);
    fillReplyHtml(msg);
    fillEmptyHtml(msg);
    sanitizeHtml(msg);

    if (_.isEmpty(msg.notAlreadyAttachments)) msg.notAlreadyAttachments = [];
    msg.previewId = Futil.generateUID();
    msg.messageId = msg.messageId.substring(1, msg.messageId.length - 1);
    if (!msg.messageId) msg.messageId = Futil.generateUID();
    if (!msg.flags) msg.flags = [];
    if (!msg.receivedDate) {
        msg.receivedDate = msg.date;
    }

    // if(msg.from) msg.from = msg.from.value;
    // fix undiscovered bugs
    if (_.isArray(msg.from)) {
        msg.from = processDoubleQuotes(msg.from);
    }

    // if(msg.to) msg.to = msg.to.value;
    if (_.isArray(msg.to)) {
        msg.to = processDoubleQuotes(msg.to);
    }

    if (msg.cc) msg.cc = msg.cc.value;
    if (_.isArray(msg.cc)) {
        msg.cc = processDoubleQuotes(msg.cc);
    }

    if (msg.bcc) msg.bcc = msg.bcc.value;
    if (_.isArray(msg.bcc)) {
        msg.bcc = processDoubleQuotes(msg.bcc);
    }
    if (!msg.from) msg.from = [{ address: user.account }];
    if (!msg.to) msg.to = [];
    if (!_.isEmpty((msg.attributes || {}).struct)) {
        processRawAttachmentParts(msg);
    }
};

function parseFrom(msg, user) {
    if (_.isString(msg.from)) {
        // if (msg.from.match(/[a-zA-Z0-9._-]{0,255}@[a-zA-Z0-9._-]{0,255}\.[a-zA-Z0-9_-]{0,255}/gi)) {
        if (validator.isEmail(msg.from)) {
            return msg.from;
        }
        if (!_.isEmpty(user.full_name)) {
            return `${user.full_name} ${msg.from || user.user_smtp}`;
        }
        return msg.from || user.user_smtp;
    }
    let name;
    let addr;

    if (_.isArray(msg.from)) {
        name = msg.from[0].name;
        addr = msg.from[0].address;
    } else if (_.isObject(msg.from)) {
        name = msg.from.name;
        addr = msg.from.address;
    }

    if (!_.isEmpty(name)) return `${name} ${addr}`;
    if (!_.isEmpty(user.full_name)) return `${user.full_name} ${addr}`;
    return addr;
}

module.exports = {
    encodeFolderNames,
    findAttachmentParts,
    toUpper,
    addMsgProps,
    parseFrom
};
