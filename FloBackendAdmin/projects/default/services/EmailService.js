const _ = require('lodash');
const cheerio = require('cheerio');
const Fs = require('fs');
const AsyncForEach = require('await-async-foreach');
const { GetFilesizeInBytes, FindPath } = require('../utilities/Utils');
const { fileType } = require('../utilities/Files');
const {
    PATH_UPLOAD, MAX_FEEDBACK_CONTENT_LENGTH
} = require('../constants/AppsConstant');

function convertToHtmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ProcessActionScripts(msg) {
    const data = {
        html: msg.html,
        text: msg.text
    };
    if (msg.html) {
        const html = cheerio.load(msg.html);
        html('script,noscript,style').remove();
        data.html = html('body').html();
    }
    if (msg.text) {
        const html = cheerio.load(msg.text);
        html('script,noscript,style').remove();
        data.text = html('body').text();
        data.text = convertToHtmlEntities(data.text);
    }
    return data;
}

async function ProcessMessageAttachments(msg, req) {
    const messageAttachments = [];
    let length = 0;
    if (!_.isEmpty(msg.attachments)) {
        let error = false;
        let message = false;
        
        await AsyncForEach(msg.attachments, async (a) => {
            let attachmentPath;
            if (error === false) {
                attachmentPath = FindPath({
                    req,
                    userId: msg.userId,
                    pathUpload: PATH_UPLOAD,
                    attId: msg.attId,
                    filename: a.name || a.filename || a.fileName || a.generatedFileName,
                    fileUuid: a.fileUuid
                });

                if (!Fs.existsSync(attachmentPath)) {
                    error = true;
                    message = 'File attachment does not exist';
                }
                if (error === false) {
                    length += GetFilesizeInBytes(attachmentPath);
                    const fileExtension = await fileType(attachmentPath);       
                    if (_.isEmpty(fileExtension) === true) {
                        error = true;
                        message = 'Invalid file extension';
                    }         
                    
                    messageAttachments.push({
                        filename: a.name || a.filename || a.fileName || a.generatedFileName,
                        name: a.name || a.filename || a.fileName || a.generatedFileName,
                        contentType: fileExtension.mime,
                        path: attachmentPath,
                        fileUuid: a.fileUuid
                    });
                }
            }
        });
        if (error === true) {
            return {
                code: 0,
                message
            };
        }
    
        if (length > MAX_FEEDBACK_CONTENT_LENGTH) {
            return {
                code: 0,
                message: 'Maximum email size exceeded (25MB)'
            };
        }
    }
    
    return {
        code: 1,
        messageAttachments,
        contentLength: length
    };
}

module.exports = {
    ProcessActionScripts,
    ProcessMessageAttachments
};
