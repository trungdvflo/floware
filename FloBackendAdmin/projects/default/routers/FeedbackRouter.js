const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const FeedbackModule = require('../modules/FeedbackModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const payloadPost = Joi.object({
  attId: QuerysConstant.FEEDBACK_ATT_ID.required(),
  subject: QuerysConstant.FEEDBACK_SUBJECT.required(),
  html: QuerysConstant.FEEDBACK_HTML.required(),
  attachments: QuerysConstant.FEEDBACK_ATTACHMENTS.optional().allow('', null)

});

const payloadPostUpload = Joi.object({
  flowChunkNumber: QuerysConstant.FLOW_CHUNK_NUMBER.required(),
  flowChunkSize: QuerysConstant.FLOW_CHUNK_SIZE.required(),
  flowCurrentChunkSize: QuerysConstant.FLOW_CURRENT_CHUNK_SIZE.required(),
  flowTotalSize: QuerysConstant.FLOW_TOTAL_SIZE.max(25000000).required(),
  flowIdentifier: QuerysConstant.FLOW_IDENTIFIER.required(),
  flowFilename: QuerysConstant.FLOW_FILE_NAME.required(),
  flowRelativePath: QuerysConstant.FLOW_RELATIVE_PATH.required(),
  flowTotalChunks: QuerysConstant.FLOW_TOTAL_CHUNKS.required(),
  file: QuerysConstant.FILE.required()
});

routers.push({
  method: 'POST',
  path: '/feedback',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FeedbackModule.SendFeedBack(request, h);
    },
    description: 'Request to send a feedback to administrator',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: payloadPost
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.object({
            message: Joi.string().example('Send feedback successfully')
          })
        }).description('Request successfully'),
        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(400),
          error: Joi.object({
            message: Joi.array().items(
              'Sending to at least one recipient failed'
            )
          })
        }).description('Sending to at least one recipient failed'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(400),
          error: Joi.object({
            message: Joi.array().items(
              'File attachment does not exist'
            )
          })
        }).description('File attachment does not exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(400),
          error: Joi.object({
            message: Joi.array().items(
              'Invalid file extension'
            )
          })
        }).description('Invalid file extension'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(400),
          error: Joi.object({
            message: Joi.array().items(
              'Maximum email size exceeded (25MB)'
            )
          })
        }).description('Maximum email size exceeded'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Feedback']
  }
});

/**
 * Upload release files
 */
routers.push({
  method: 'POST',
  path: '/feedback/upload',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      request.plugins.good = {
        suppressResponseEvent: true
      };
      return FeedbackModule.Upload(request, h);
    },
    description: 'Upload feedback files, max part size will be 25MB (25,000,000 bytes)',
    plugins: {
      'hapi-swagger': {
        payloadType: 'form'
      }
    },
    payload: {
      output: 'stream',
      allow: 'multipart/form-data',
      maxBytes: 25000000,
      parse: true,
      timeout: false
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: payloadPostUpload
    },
    response: {
      status: {
        [`${Code.REQUEST_SUCCESS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(200),
          data: Joi.object({
            fileName: QuerysConstant.FILE_NAME,
            fileUid: QuerysConstant.FILE_UID,
            length: QuerysConstant.LENGTH,
            message: QuerysConstant.MESSAGE.example('Upload file successfully')
          })
        }).description('Upload file successfully'),
        [`${Code.REQUEST_SUCCESS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(10001),
          data: Joi.object({
            message: QuerysConstant.MESSAGE.example('File upload is in processing')
          })
        }).description('File upload is in processing'),
        [`${Code.SYSTEM_ERROR}`]: Joi.object().description('System error')
      }
    },

    tags: ['api', 'Feedback']
  }
});

module.exports = routers;
