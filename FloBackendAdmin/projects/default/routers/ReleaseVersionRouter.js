/* eslint-disable max-len */
const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const ReleaseVersionModule = require('../modules/ReleaseVersionModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];
const responseRelease = Joi.object({
  id: QuerysConstant.ID,
  owner: QuerysConstant.OWNER,
  version: QuerysConstant.VERSION,
  checksum: QuerysConstant.CHECKSUM.optional().allow(null, ''),
  release_note: QuerysConstant.RELEASE_NOTE,
  description: QuerysConstant.DESCRIPTION,
  release_type: QuerysConstant.RELEASE_TYPE,
  title: QuerysConstant.RELEASE_TITLE,
  message: QuerysConstant.RELEASE_MESSAGE,
  expire_date: QuerysConstant.EXPIRE_DATE,
  message_expire: QuerysConstant.MESSAGE_EXPIRE,
  file_uid: QuerysConstant.FILE_UID.optional().allow(null, ''),
  url_update_file: QuerysConstant.URL_UPDATE_FILE.optional().allow(null, ''),
  app_id: QuerysConstant.APP_ID,
  build_number: QuerysConstant.BUILD_NUMBER,
  os_support: QuerysConstant.OS_SUPPORT,
  length: QuerysConstant.LENGTH.optional().allow(null, ''),
  file_dsym: QuerysConstant.FILE_DSYM.optional().allow(null, ''),
  file_dsym_uid: QuerysConstant.FILE_DSYM_UID.optional().allow(null, ''),
  length_dsym: QuerysConstant.LENGTH.optional().allow(null, ''),
  url_download: QuerysConstant.RELEASE_URL_DOWNLOAD.optional().allow(null, ''),
  url_dsym_file: QuerysConstant.URL_DSYM_FILE.optional().allow(null, ''),
  file_name: QuerysConstant.FILE_NAME.optional().allow(null, ''),
  release_time: QuerysConstant.RELEASE_TIME.optional().allow(null, ''),
  upload_status: QuerysConstant.UPLOAD_STATUS.optional().allow(null, ''),
  release_status: QuerysConstant.RELEASE_STATUS,
  is_expired: QuerysConstant.IS_EXPIRED,
  created_date: QuerysConstant.CREATED_DATE,
  updated_date: QuerysConstant.UPDATED_DATE,
});

/**
 * Get list release version
 */
routers.push({
  method: 'GET',
  path: '/releases',
  options: {
    auth: 'OAuth',
    description: 'Get list release version',
    handler(request, h) {
      return ReleaseVersionModule.GetReleaseVersions(request, h);
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        app_ids: QuerysConstant.APP_IDS,
        filter_key: QuerysConstant.FILTER_KEY,
        keyword: QuerysConstant.KEYWORD,
        sort: QuerysConstant.SORT.description('Field name and sort type.\n [+] : >> asending \n [-] : >> decending \n Example : -id,+title \n\n Available field: \n - id \n  - build_number \n  - release_status \n  - release_time \n  - created_date \n  - updated_date'),
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(200),
          data: Joi.array().items(responseRelease)
        }).description('Request successfully'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Get Detail release version
 */
routers.push({
  method: 'GET',
  path: '/releases/{id}',
  options: {
    auth: 'OAuth',
    description: 'Get detail release version',
    handler(request, h) {
      return ReleaseVersionModule.GetReleaseVersion(request, h);
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example('200'),
          data: responseRelease
        }).description('Request successfully'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Upload release files
 */
routers.push({
  method: 'POST',
  path: '/release-files',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      request.plugins.good = {
        suppressResponseEvent: true
      };
      return ReleaseVersionModule.Upload(request, h);
    },
    description: 'Upload release files, max part size will be 100MB (100,000,000 bytes)',
    plugins: {
      'hapi-swagger': {
        payloadType: 'form'
      }
    },
    payload: {
      output: 'stream',
      allow: 'multipart/form-data',
      maxBytes: 100 * 1000 * 1000,
      parse: true,
      timeout: false,
      multipart: true
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        file: QuerysConstant.FILE.required(),
        flowChunkNumber: QuerysConstant.FLOW_CHUNK_NUMBER.required(),
        flowChunkSize: QuerysConstant.FLOW_CHUNK_SIZE.required(),
        flowCurrentChunkSize: QuerysConstant.FLOW_CURRENT_CHUNK_SIZE.required(),
        flowTotalSize: QuerysConstant.FLOW_TOTAL_SIZE.required(),
        flowIdentifier: QuerysConstant.FLOW_IDENTIFIER.required(),
        flowFilename: QuerysConstant.FLOW_FILE_NAME.required(),
        flowRelativePath: QuerysConstant.FLOW_RELATIVE_PATH.required(),
        flowTotalChunks: QuerysConstant.FLOW_TOTAL_CHUNKS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(200),
          status:QuerysConstant.STATUS_FLOWJS.example('done'),
          data: Joi.object({
            fileName: QuerysConstant.FILE_NAME,
            fileUid: QuerysConstant.FILE_UID,
            length: QuerysConstant.LENGTH,
            url: QuerysConstant.URL_UPDATE_FILE,
            message: QuerysConstant.MESSAGE.example('Upload file successfully')
          })
        }).description('Upload file successfully'),

        [`${Code.REQUEST_SUCCESS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(10001),
          data: Joi.object({
            message: QuerysConstant.MESSAGE.example('File upload is in processing')
          })
        }).description('File upload is in processing'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },

    tags: ['api', 'Auto Update']
  }
});

/**
 * Create a release version
 */
routers.push({
  method: 'POST',
  path: '/releases',
  options: {
    auth: 'OAuth',
    description: 'Create a release version',
    notes: `
        Payload body for FloMac: 
        \n* __version (*)__
        \n* __checksum (*)__
        \n* __release_type (*)__
        \n* __app_id (*)__
        \n* __build_number (*)__ (max: 999999999999999)
        \n*  __os_support (*)__
        \n* __file_dsym (*)__
        \n* __file_dsym_uid (*)__
        \n* __file_uid (*)__
        \n* __file_name (*)__
        \n* length
        \n* description
        \n* release_note
        \n* release_time
        \n* release_status : _default 0 (Not started)_
        \n* title
        \n* message
        \n* expire_date: expire date of build A, it will be displayed on the popup
        \n* message_expire: still store in DB - response to the client app, but the FE ưill skip this field (FE ưill use in the future)
        \n
        Example payload body for FloMac: 
        {
            "version": "1.0.1",
            "release_type": 0,
            "os_support": "10.14",
            "build_number": 19082701,
            "app_id": "ad944424393cf309efaf0e70f1b125cb",
            "checksum": "7cLALFUHSwvEJWSkV8aMreoBe4fhRa4FncC5NoThKxwThL6FDR7hTiPJh1fo2uagnPogisnQsgFgq6mGkt2RBw==",
            "release_note": "Release note",
            "description": "Description note",
            "file_dsym": "FloMac01_dsym.zip",
            "file_dsym_uid": "nvttalz6nbgs6-201909260-1568691254198",
            "file_uid": "24f36aee389645429e95e81b93c8d8b2",
            "file_name": "FloMac01.zip",
            "length": 105762775,
            "release_time": 1566464330.816,
            "release_status": 0,
            "title": "Upgrade new version",
            "message": "You need update your Flo app to this version 1.0.1",
            "old_build_expire":123456,
            "message_expire": ""
        }
        \n
        Payload body for Flo IOS/IPadOS: 
        \n* __version (*)__
        \n* __release_type (*)__
        \n* __app_id (*)__
        \n* __build_number (*)__ (max: 999999999999999)
        \n*  __os_support (*)__ 
        \n* description
        \n* release_note
        \n* release_time
        \n* length: _Will be 0_
        \n* release_status: _Will be 2 (Published)_
        \n* url_download
        \n* title
        \n* message
        \n* expire_date: expire date of build A, it will be displayed on the popup
        \n* message_expire: still store in DB - response to the client app, but the FE ưill skip this field (FE ưill use in the future)
        \n
        Example payload body for Flo IOS/IPadOS: 
        {
            "version": "1.0.1",
            "release_type": 0,
            "build_number": 19082701,
            "os_support": "10.14",
            "app_id": "ad944424393cf309efaf0e70f1b125cb",
            "release_note": "Release note",
            "description": "Description note",
            "release_time": 1566464330.816,
            "release_status": 0,
            "url_download": "https://download.com",
            "title": "Upgrade new version",
            "message": "You need update your Flo app to this version 1.0.1",
            "old_build_expire":123456,
            "message_expire": ""
        }

        Available release_status value: 
        \n* 0: Not started 
        \n* 1: In progress 
        \n* 2: Published 
        \n* 3: Declined
        \n\n
        Available app_id value: 
        \n* Flo Mac: ad944424393cf309efaf0e70f1b125cb
        \n* Flo iOS: faf0e70f1bad944424393cf309e125cb
        \n* Flo iPad: d944424393cf309e125cbfaf0e70f1ba
        `,
    handler(request, h) {
      return ReleaseVersionModule.CreateReleaseVersion(request, h);
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        version: QuerysConstant.VERSION.required(),
        release_type: QuerysConstant.RELEASE_TYPE.required(),
        os_support: QuerysConstant.OS_SUPPORT.required(),
        build_number: QuerysConstant.BUILD_NUMBER.max(999999999999999).required(),
        app_id: QuerysConstant.APP_ID.valid(
          'ad944424393cf309efaf0e70f1b125cb',
          'faf0e70f1bad944424393cf309e125cb',
          'd944424393cf309e125cbfaf0e70f1ba'
        ).example('ad944424393cf309efaf0e70f1b125cb').required(),
        checksum: QuerysConstant.CHECKSUM
          .optional()
          .allow(null, '')
          .description(`
                * Important: Only working for FloMAC:
                \n - It is string and it will be hashed by client side. 
                \n - Will response "" for Other platforms
                `),
        release_note: QuerysConstant.RELEASE_NOTE,

        description: QuerysConstant.DESCRIPTION,
        file_dsym: QuerysConstant.FILE_DSYM
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - This is real name of file which uploaded to server side (it will be shown on the UI of Admin page)
                    \n - Will response "" for Other platforms
                    `),
        file_dsym_uid: QuerysConstant.FILE_DSYM_UID
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - This is real name of file which uploaded to server side (it will be shown on the UI of Admin page)
                    \n - Will response "" for Other platforms
                    `),
        file_uid: QuerysConstant.FILE_UID
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - It is ID of file which stored in HDD (it will be generated by server side)
                    \n - Will response "" for Other platforms
                    `),
        file_name: QuerysConstant.FILE_NAME
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - This is real name of file which uploaded to server side (it will be shown on the UI of Admin page)
                    \n - Will response "" for Other platforms
                    `),
        url_download: QuerysConstant.RELEASE_URL_DOWNLOAD.optional().allow(null, ''),
        length: QuerysConstant.LENGTH.optional().allow(null, ''),
        length_dsym: QuerysConstant.LENGTH.optional().allow(null, ''),
        release_time: QuerysConstant.RELEASE_TIME.optional().allow(null, ''),
        release_status: QuerysConstant.RELEASE_STATUS.optional().allow(null),
        title: QuerysConstant.RELEASE_TITLE,
        message: QuerysConstant.RELEASE_MESSAGE,
        expire_date: QuerysConstant.EXPIRE_DATE,
        message_expire: QuerysConstant.MESSAGE_EXPIRE
      })
    },
    response: {
      status: {
        [Code.CREATE_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(201),
          data: responseRelease
        }).description('Create successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid app_id')
            )
          })
        }).description('Invalid app_id'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Release version already exist')
            )
          })
        }).description('Release version already exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_uid doesn\'t exist')
            )
          })
        }).description('File_uid doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_dsym_uid doesn\'t exist')
            )
          })
        }).description('File_dsym_uid doesn\'t exist'),
        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid version format')
            )
          })
        }).description('Version name is not valid Semantic Versioning format'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#6`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_uid is required')
            )
          })
        }).description('file_uid is required'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#7`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_dsym_uid is required')
            )
          })
        }).description('File_dsym_uid is required'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#8`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Checksum is required')
            )
          })
        }).description('Checksum is required'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#9`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_name is required')
            )
          })
        }).description('File_name is required'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },

    tags: ['api', 'Auto Update']
  }
});

/**
 * Modify a release version
 */
routers.push({
  method: 'PUT',
  path: '/releases/{id}',

  options: {
    auth: 'OAuth',
    description: 'Modify a release version',
    notes: `
        Payload body for FloMac: 
        \n* __version (*)__
        \n* __checksum (*)__
        \n* __release_type (*)__
        \n* __app_id (*)__
        \n* __build_number (*)__ (max: 999999999999999)
        \n*  __os_support (*)__
        \n* file_dsym
        \n* file_dsym_uid
        \n* file_uid
        \n* file_name
        \n* description
        \n* release_note
        \n* release_time
        \n* release_status
        \n* title
        \n* message
        \n* expire_date: expire date of build A, it will be displayed on the popup
        \n* message_expire: still store in DB - response to the client app, but the FE ưill skip this field (FE ưill use in the future)
        \n
        Example payload body for FloMac: 
        {
            "version": "1.0.1",
            "release_type": 0,
            "build_number": 19082701,
            "os_support": "10.14",
            "app_id": "ad944424393cf309efaf0e70f1b125cb",
            "checksum": "7cLALFUHSwvEJWSkV8aMreoBe4fhRa4FncC5NoThKxwThL6FDR7hTiPJh1fo2uagnPogisnQsgFgq6mGkt2RBw==",
            "release_note": "Release note",
            "description": "Description note",
            "file_dsym": "FloMac01_dsym.zip",
            "file_dsym_uid": "nvttalz6nbgs6-201909260-1568691254198",
            "file_uid": "24f36aee389645429e95e81b93c8d8b2",
            "file_name": "FloMac01.zip",
            "length": 105762775,
            "release_time": 1566464330.816,
            "release_status": 0,
            "title": "Upgrade new version",
            "message": "You need update your Flo app to this version 1.0.1",
            "old_build_expire":123456,
            "message_expire": ""
          }
        \n
        Payload body for IOS/IPadOS: 
        \n* __version (*)__
        \n* __release_type (*)__
        \n* __app_id (*)__
        \n* __build_number (*)__ (max: 999999999999999)
        \n*  __os_support (*)__ 
        \n* description
        \n* release_note
        \n* release_time
        \n* release_status
        \n* url_download
        \n* title
        \n* message
        \n* expire_date: expire date of build A, it will be displayed on the popup
        \n* message_expire: still store in DB - response to the client app, but the FE ưill skip this field (FE ưill use in the future)
        \n
        Example payload body for Flo IOS/IPadOS: 
        {
            "version": "1.0.1",
            "release_type": 0,
            "build_number": 19082701,
            "os_support": "10.14",
            "app_id": "ad944424393cf309efaf0e70f1b125cb",
            "release_note": "Release note",
            "description": "Description note",
            "release_time": 1566464330.816,
            "release_status": 0,
            "url_download": "https://download.com",
            "title": "Upgrade new version",
            "message": "You need update your Flo app to this version 1.0.1",
            "old_build_expire":123456,
            "message_expire": ""
        }
        \n
        Available release_status value: 
        \n* 0: Not started 
        \n* 1: In progress 
        \n* 2: Published 
        \n* 3: Declined
        \n\n
        Available app_id value: 
        \n* Flo Mac: ad944424393cf309efaf0e70f1b125cb
        \n* Flo iOS: faf0e70f1bad944424393cf309e125cb
        \n* Flo iPad: d944424393cf309e125cbfaf0e70f1ba
        `,
    handler(request, h) {
      return ReleaseVersionModule.ModifyReleaseVersion(request, h);
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      }),
      payload: Joi.object({
        version: QuerysConstant.VERSION.required(),
        release_type: QuerysConstant.RELEASE_TYPE.required(),
        build_number: QuerysConstant.BUILD_NUMBER.max(999999999999999).required(),
        os_support: QuerysConstant.OS_SUPPORT.required(),
        app_id: QuerysConstant.APP_ID.valid(
          'ad944424393cf309efaf0e70f1b125cb',
          'faf0e70f1bad944424393cf309e125cb',
          'd944424393cf309e125cbfaf0e70f1ba'
        ).example('ad944424393cf309efaf0e70f1b125cb').required(),
        checksum: QuerysConstant.CHECKSUM
          .optional()
          .allow(null, '')
          .description(`
                * Important: Only working for FloMAC:
                \n - It is string and it will be hashed by client side. 
                \n - Will response "" for Other platforms
                `),
        release_note: QuerysConstant.RELEASE_NOTE,
        description: QuerysConstant.DESCRIPTION,
        file_dsym: QuerysConstant.FILE_DSYM
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - This is real name of file which uploaded to server side (it will be shown on the UI of Admin page)
                    \n - Will response "" for Other platforms
                    `),
        file_dsym_uid: QuerysConstant.FILE_DSYM_UID
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - This is real name of file which uploaded to server side (it will be shown on the UI of Admin page)
                    \n - Will response "" for Other platforms
                    `),
        file_uid: QuerysConstant.FILE_UID
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - It is ID of file which stored in HDD (it will be generated by server side)
                    \n - Will response "" for Other platforms
                    `),
        file_name: QuerysConstant.FILE_NAME
          .optional()
          .allow(null, '')
          .description(`
                    * Important: Only working for FloMAC:
                    \n - This is real name of file which uploaded to server side (it will be shown on the UI of Admin page)
                    \n - Will response "" for Other platforms
                    `),
        url_download: QuerysConstant.RELEASE_URL_DOWNLOAD.optional().allow(null, ''),
        length: QuerysConstant.LENGTH.optional().allow(null, ''),
        length_dsym: QuerysConstant.LENGTH.optional().allow(null, ''),
        release_time: QuerysConstant.RELEASE_TIME.optional().allow(null, ''),
        release_status: QuerysConstant.RELEASE_STATUS
          .description('Status of this release: \n * 0 : not started, \n * 1: in progress, \n * 2: published, \n * 3: declined \n * _release_status value can be null_')
          .optional()
          .allow(null, ''),
        title: QuerysConstant.RELEASE_TITLE,
        message: QuerysConstant.RELEASE_MESSAGE,
        expire_date: QuerysConstant.EXPIRE_DATE,
        message_expire: QuerysConstant.MESSAGE_EXPIRE
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example('200'),
          data: responseRelease
        }).description('Update successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid app_id')
            )
          })
        }).description('Invalid app_id'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Release version already exist')
            )
          })
        }).description('Release version already exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_uid doesn\'t exist')
            )
          })
        }).description('File_uid doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('File_dsym_uid doesn\'t exist')
            )
          })
        }).description('File_dsym_uid doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid app_id')
            )
          })
        }).description('Invalid app_id'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#6`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid checksum')
            )
          })
        }).description('When there is changed in File for FileDsym but param checksum is empty'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#7`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid length')
            )
          })
        }).description('When there is changed in File for FileDsym but param length is not number'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#8`]: Joi.object({
          code: Joi.number().example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Update release version fail, please try again later!')
            )
          })
        }).description('When everything is ok but modify release version fail, this is server error'),
        [`${Code.INVALID_PAYLOAD_PARAMS}#9`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid version format')
            )
          })
        }).description('Version name is not valid Semantic Versioning format'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: Joi.number().example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Delete a release version
 */
routers.push({
  method: 'DELETE',
  path: '/releases/{id}',
  options: {
    auth: 'OAuth',
    description: 'Delete a release version',
    handler(request, h) {
      return ReleaseVersionModule.DeleteReleaseVersion(request, h);
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successful'),
        [Code.NOT_FOUND]: Joi.object({
          code: QuerysConstant.CODE.example(Code.NOT_FOUND),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Not found')
          })
        }).description('Not found'),
        [`${Code.INVALID_PAYLOAD_PARAMS}  `]: Joi.object({
          code: Joi.number().example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Remove release version fail, please try again later !')
            )
          })
        }).description('When everything is ok but remove release version fail, this is server error'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Get release groups detail
 */
routers.push({
  method: 'GET',
  path: '/releases/{release_id}/groups',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.GetReleaseGroups(request, h);
    },
    description: 'Get list release group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID.required()
      }),
      query: Joi.object({
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })

    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example('200'),
          data: Joi.array().items(

            Joi.object({
              id: QuerysConstant.ID,
              name: QuerysConstant.GROUP_NAME,
              description: QuerysConstant.GROUP_DESCRIPTION.optional().allow('', null)
            }).optional().allow('', null)

          )
        }).description('Request successfully'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Get release users detail
 */
routers.push({
  method: 'GET',
  path: '/releases/{release_id}/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.GetReleaseUsers(request, h);
    },
    description: 'Get list release user',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID.required()
      }),

      query: Joi.object({
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })

    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example('200'),
          data: Joi.array().items(
            Joi.object({
              email: QuerysConstant.EMAIL.optional().allow('', null),
              fullname: Joi.string().optional().allow('', null)
            }).optional().allow('', null)

          )
        }).description('Request successfully'),
        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Create release users
 */
routers.push({
  method: 'POST',
  path: '/releases/{release_id}/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.CreateReleaseUsers(request, h);
    },
    description: 'Create release users, Filters Only working when type = 1, Emails Only working when type = 0',

    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID.required()
      }),
      payload: Joi.object({
        type: QuerysConstant.GROUP_RELEASE_TYPE.required(),
        filters: Joi.object({
          keyword: Joi.string()
            .min(1)
            .max(100)
            .example('Hello world')
            .description('Keyword search')
            .optional()
            .allow(null, ''),
          group_ids: Joi.string()
            .example('-1,2,3,4,5,6,7')
            .description('List of group_id')
            .optional()
            .allow(null, ''),
          group_type: Joi.number()
            .valid(0, 1)
            .example(0)
            .description(' * 0: QA_GROUP: Group for QA \n - 1: RELEASE_GROUP: Group for Release')
            .optional()
            .allow(null, ''),
          account_type: Joi.number()
            .valid(0, 1, 2, 3)
            .example(1)
            .description(' * 0: Google \n - 1: Yahoo \n - 2: iCloud \n - 3: Other')
            .optional()
            .allow(null, ''),
          subscription_type: Joi.number()
            .valid(0, 1, 2)
            .example(0)
            .description(' * 0: Premium \n - 1: Pro \n - 2: Standard')
            .optional()
            .allow(null, '')
        }).description(' * Filter conditions **Only working when type = 1** \n *If type = 0 this param will be ignore*')
          .optional()
          .allow(null, ''),

        emails: Joi.array().items(
          QuerysConstant.EMAIL.optional().allow('', null)
        ).description(' * List email **Only working when type = 0** \n *If type = 1 this param will be ignore*')
          .optional()
          .allow(null, '')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(Code.REQUEST_SUCCESS),
          data: {
            message: QuerysConstant.MESSAGE.example('Create users release success')
          }
        }).description('Create users release success'),

        [`${Code.INVALID_SERVICE}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.INVALID_SERVICE}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('User doesn\'t exist')
          })
        }).description('User doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid email')
            )
          })
        }).description('Invalid email'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Modify release users
 */
routers.push({
  method: 'PUT',
  path: '/releases/{release_id}/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.ModifyReleaseUsers(request, h);
    },
    description: 'Modify release users, Filters Only working when type = 1, Emails Only working when type = 0',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID.required()
      }),
      payload: Joi.object({
        type: QuerysConstant.GROUP_RELEASE_TYPE.required(),
        filters: Joi.object({
          keyword: Joi.string()
            .min(1)
            .max(100)
            .example('Hello world')
            .description('Keyword search')
            .optional()
            .allow(null, ''),
          group_ids: Joi.string()
            .example('-1,2,3,4,5,6,7')
            .description('List of group_id')
            .optional()
            .allow(null, ''),
          group_type: Joi.number()
            .valid(0, 1)
            .example(0)
            .description(' * 0: QA_GROUP: Group for QA \n - 1: RELEASE_GROUP: Group for Release')
            .optional()
            .allow(null, ''),
          account_type: Joi.number()
            .valid(0, 1, 2, 3)
            .example(1)
            .description(' * 0: Google \n - 1: Yahoo \n - 2: iCloud \n - 3: Other')
            .optional()
            .allow(null, ''),
          subscription_type: Joi.number()
            .valid(0, 1, 2)
            .example(0)
            .description(' * 0: Premium \n - 1: Pro \n - 2: Standard')
            .optional()
            .allow(null, '')
        }).description(' * Filter conditions **Only working when type = 1** \n *If type = 0 this param will be ignore*')
          .optional()
          .allow(null, ''),

        emails: Joi.array().items(
          QuerysConstant.EMAIL.optional().allow('', null)
        ).description(' * List email **Only working when type = 0** \n *If type = 1 this param will be ignore*')
          .optional()
          .allow(null, '')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(201),
          data: {
            message: QuerysConstant.MESSAGE
          }
        }).description('Modify successfully'),

        [`${Code.INVALID_SERVICE}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.INVALID_SERVICE}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('User doesn\'t exist')
          })
        }).description('User doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}  `]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid email')
            )
          })
        }).description('Invalid email'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Create release groups
 */
routers.push({
  method: 'POST',
  path: '/releases/{release_id}/groups',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.CreateReleaseGroups(request, h);
    },
    description: 'Create release groups, Filters Only working when type = 1, Group_ids Only working when type = 0',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID.required()
      }),
      payload: Joi.object({
        type: QuerysConstant.GROUP_RELEASE_TYPE.required(),
        filters: Joi.object({
          keyword: Joi.string()
            .min(1)
            .max(100)
            .example('Hello world')
            .description('Keyword search')
            .optional()
            .allow(null, '')

        }).description('* Filter conditions **Only working when type = 1** \n *If type = 0 this param will be ignore*')
          .optional()
          .allow(null, ''),
        group_ids: Joi.array().items(
          QuerysConstant.GROUP_ID.optional().allow('', null)
        ).description('* List group_id **Only working when type = 0** \n *If type = 1 this param will be ignore*')
          .optional()
          .allow(null, '')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(201),
          data: {
            message: QuerysConstant.MESSAGE
          }
        }).description('Create successfully'),

        [`${Code.INVALID_SERVICE}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.INVALID_SERVICE}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Group doesn\'t exist')
          })
        }).description('Group doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}  `]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid group')
            )
          })
        }).description('Invalid group'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Modify release groups
 */
routers.push({
  method: 'PUT',
  path: '/releases/{release_id}/groups',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.ModifyReleaseGroups(request, h);
    },
    description: 'Modify release groups, Filters Only working when type = 1, Group_ids Only working when type = 0',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID.required()
      }),
      payload: Joi.object({
        type: QuerysConstant.GROUP_RELEASE_TYPE.required(),
        filters: Joi.object({
          keyword: Joi.string()
            .min(1)
            .max(100)
            .example('Hello world')
            .description('Keyword search')
            .optional()
            .allow(null, '')

        }).description('* Filter conditions **Only working when type = 1** \n *If type = 0 this param will be ignore*')
          .optional()
          .allow(null, ''),
        group_ids: Joi.array().items(
          QuerysConstant.GROUP_ID.optional().allow('', null)
        ).description('* List group_id **Only working when type = 0** \n *If type = 1 this param will be ignore*')
          .optional()
          .allow(null, '')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(201),
          data: {
            message: QuerysConstant.MESSAGE
          }
        }).description('Modify successfully'),

        [`${Code.INVALID_SERVICE}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release version doesn\'t exist')
          })
        }).description('Release version doesn\'t exist'),

        [`${Code.INVALID_SERVICE}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Group doesn\'t exist')
          })
        }).description('Group doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid group')
            )
          })
        }).description('Invalid group'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Modify group release fail')
            )
          })
        }).description('When everything is ok but modify groups fails, this is server error'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Delete release group
 */
routers.push({
  method: 'DELETE',
  path: '/releases/{release_id}/groups/{group_id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.DeleteReleaseGroup(request, h);
    },
    description: 'Delete all release-groups by target id',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID,
        group_id: QuerysConstant.GROUP_ID
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successfully'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release group doesn\'t exist')
          })
        }).description('Release group doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Delete release all group
 */
routers.push({
  method: 'DELETE',
  path: '/releases/{release_id}/groups',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.DeleteReleaseGroups(request, h);
    },
    description: 'Delete all release-groups group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successfully'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release group doesn\'t exist')
          })
        }).description('Release group doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Delete release user
 */
routers.push({
  method: 'DELETE',
  path: '/releases/{release_id}/users/{email}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.DeleteReleaseUser(request, h);
    },
    description: 'Delete release-groups user',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID,
        email: QuerysConstant.EMAIL
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successfully'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('User doesn\'t exist')
          })
        }).description('User doesn\'t exist'),

        [`${Code.INVALID_SERVICE}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release user doesn\'t exist')
          })
        }).description('Release user doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Delete release all user
 */
routers.push({
  method: 'DELETE',
  path: '/releases/{release_id}/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.DeleteReleaseUsers(request, h);
    },
    description: 'Delete all release-groups user',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        release_id: QuerysConstant.RELEASE_ID
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successfully'),
        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release user doesn\'t exist')
          })
        }).description('Release user doesn\'t exist'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

routers.push({
  method: 'GET',
  path: '/downloads',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ReleaseVersionModule.Downloads(request, h);
    },
    validate: {
      query: Joi.object({
        type: QuerysConstant.DOWNLOAD_TYPE.required(),
        uuid: QuerysConstant.FILE_UID.required(),
        app_id: QuerysConstant.APP_ID.required(),
        device_uid: QuerysConstant.DEVICE_UID.required(),
        token: QuerysConstant.ACCESS_TOKEN.required(),
      })
    },
    response: {
      status: {
        [`${Code.INVALID_SERVICE}#1`]: Joi.object({
          code: Joi.number().example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Downloaded file does not exist')
          })
        }).description('Downloaded file does not exist'),
        [`${Code.INVALID_SERVICE}#2`]: Joi.object({
          code: Joi.number().example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Release does not exist')
          })
        }).description('Release does not exist'),

        [`${Code.INVALID_SERVICE}#3`]: Joi.object({
          code: Joi.number().example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('File does not exist')
          })
        }).description('File does not exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

/**
 * Get upload status
 */
routers.push({
  method: 'GET',
  path: '/releases/{id}/check_upload_status/{file_uid}',
  options: {
    auth: 'OAuth',
    description: 'Check upload status',
    handler(request, h) {
      return ReleaseVersionModule.CheckUploadStatus(request, h);
    },
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID,
        file_uid: QuerysConstant.FILE_UID.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example('200'),
          data: Joi.object({
            id: QuerysConstant.ID,
            upload_status: QuerysConstant.UPLOAD_STATUS.optional().allow(null, ''),
            url_update_file: QuerysConstant.URL_UPDATE_FILE.optional().allow(null, ''),
            file_uid: QuerysConstant.FILE_UID.optional().allow(null, '')
          })
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Lack of required params')
          })
        }).description('Lack of required params'),
        [`${Code.SYSTEM_ERROR}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.SYSTEM_ERROR),
          error: Joi.object({
            id: QuerysConstant.ID,
            upload_status: QuerysConstant.UPLOAD_STATUS.optional().allow(null, ''),
            file_uid: QuerysConstant.FILE_UID.optional().allow(null, ''),
            message: QuerysConstant.MESSAGE.example('Upload failed')
          })
        }).description('Upload failed'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

module.exports = routers;
