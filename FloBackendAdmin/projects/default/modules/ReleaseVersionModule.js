/* eslint-disable no-useless-catch */
const {
  Op
} = require('sequelize');
const Path = require('path');
const _ = require('lodash');

const {
  ReleaseModel,
  AppRegisterModel,
  GroupsModel,
  ReleaseGroupModel,
  ReleaseUserModel,
  UserModel,
  PlatformReleasePushNotificationsModel,
  UsersDeletedModel
} = require('../models');

const Code = require('../constants/ResponseCodeConstant');
const { HandleUpload, LastPartUploadTrigger, uploadStatusHandler } = require('../utilities/UploadFile');
const Utils = require('../utilities/Utils');
const { PATH_UPLOAD, AUTO_UPDATE_PATH, AUTO_UPDATE_LOCAL_PATH } = require('../constants/AppsConstant');
const App = require('../constants/AppsConstant');
const S3 = require('../utilities/aws/S3');

/**
 * Admin can upload/release new Flo app version
 * Get all Flo app version and show them on the UI (admin page)
 * Step by step [developer]:
    get list Flo app release with paging data
    return items to client
 */

const Private = {

  RemoveReleaseFiles: async (UID, fileName) => {
    try {
      if (_.isEmpty(UID) === true && _.isEmpty(fileName) === true) {
        return false;
      }
      const parseFolder = Utils.ParseFolder(UID);
      const ext = Path.extname(fileName);
      const source = `${AUTO_UPDATE_PATH}/${parseFolder}/${UID}/${UID}${ext}`;
      const isExistFile = await S3.FileExist(source);
      if (isExistFile === false) {
        return false;
      }
      const deleteS3 = await S3.Delete(source);
      const deleteS3Code = _.get(deleteS3, 'code', false);
      if (deleteS3Code !== 1) {
        return false;
      }
      return true;
    } catch (error) {
      return [];
    }
  },

  DownloadAutoUpdate: async (request) => {
    try {
      const {
        query
      } = request;
      const data = await ReleaseModel.findOne({
        where: {
          [Op.or]: [{
            file_uid: query.uuid
          },
          {
            file_dsym_uid: query.uuid
          }]
        },
        raw: true
      });

      if (_.isEmpty(data) === true) {
        return {
          code: 0,
          message: 'Release does not exist'
        };
      }
      const sourceName = data.file_uid === query.uuid ? data.file_name : data.file_dsym;
      const parseFolder = Utils.ParseFolder(query.uuid);
      const ext = Path.extname(sourceName);
      const source = `${AUTO_UPDATE_PATH}/${parseFolder}/${query.uuid}/${query.uuid}${ext}`;
      const isExistFile = await S3.FileExist(source);
      if (isExistFile.code !== 1) {
        return {
          code: 0,
          message: 'File does not exist'
        };
      }

      const file = await S3.DownloadSignedUrl(source);
      if (_.isEmpty(file) === true || file.code === 0) {
        return {
          code: 0,
          message: 'File does not exist'
        };
      }

      return {
        code: 1,
        file: file.data,
        file_name: data.file_name
      };
    } catch (error) {
      return {};
    }
  },

  FilterRelease: async (query) => {
    try {
      if (_.isEmpty(query.keyword) === true) {
        return {};
      }

      if (_.isEmpty(query.filter_key) === true) {
        return Private.FilterReleaseAIO(query.keyword);
      }
      return Private.FilterReleaseByFilterKey(query.filter_key, query.keyword);
    } catch (error) {
      return [];
    }
  },

  FilterReleaseAIO: async (keyword) => {
    try {
      const result = {};
      const releaseStatus = ['not started', 'in progress', 'published', 'declined'];
      const filter = Utils.HandleFilterToAttr(keyword);

      switch (filter.type) {
        case 'number': {
          result[Op.or] = [{
            id: filter.value
          },
          {
            build_number: filter.value
          }
          ];
          break;
        }

        case 'string': {
          result[Op.or] = [{
            version: {
              [Op.substring]: filter.value
            }
          }, {
            checksum: {
              [Op.substring]: filter.value
            }
          }, {
            file_uid: {
              [Op.substring]: filter.value
            }
          }, {
            app_id: {
              [Op.substring]: filter.value
            }
          }];

          /**
                     * Check UserId
                     * */
          const users = await UserModel.findAll({
            attributes: ['id', 'email'],
            where: {
              fullname: {
                [Op.substring]: filter.value
              }
            },
            raw: true
          });

          const userIds = [];
          if (_.isEmpty(users) === false) {
            _.forEach(users, (user) => {
              userIds.push(user.id);
            });
            result[Op.or].push({
              user_id: userIds
            });
          }

          /**
                     * Check status
                     * */
          let hasReleaseStatus = -1;
          _.forEach(releaseStatus, (status, index) => {
            const exist = status.toLowerCase().includes(filter.value.toLowerCase());
            if (exist === true) {
              hasReleaseStatus = index;
            }
          });

          if (hasReleaseStatus >= 0) {
            result[Op.or].push({
              release_status: hasReleaseStatus
            });
          }

          break;
        }
        case 'date': {
          result[Op.or] = [{
            release_time: {
              [Op.gte]: filter.value.start,
              [Op.lte]: filter.value.end
            },
            created_date: {
              [Op.gte]: filter.value.start,
              [Op.lte]: filter.value.end
            }
          }];
          break;
        }
        default:
          break;
      }

      return result;
    } catch (error) {
      return false;
    }
  },

  FilterReleaseByFilterKey: async (filterKey, keyword) => {
    try {
      const result = {};
      const filter = Utils.HandleFilterToAttr(keyword);
      /**
             * Map client request field name to Database field name
             * */
      const ignoreField = ['user_id', 'release_status'];
      const releaseStatus = ['not started', 'in progress', 'published', 'declined'];
      const mapFields = [{
        fieldName: 'owner',
        originalFieldName: 'user_id',
        originalFieldType: 'number'
      }];

      const filterField = Utils.HandleFieldSelection(filterKey, mapFields);
      const dbFields = Utils.HandleDatabaseFieldSelectionSequelize(ReleaseModel.rawAttributes, filterField);

      if (_.isEmpty(dbFields) === false) {
        result[Op.or] = [];
        _.forEach(dbFields, (dbField) => {
          if (dbField.type === 'number' && ignoreField.indexOf(dbField.fieldName) < 0) {
            const value = Number(filter.value);
            if (_.isNaN(value) === false) {
              result[Op.or].push({
                [dbField.fieldName]: {
                  [Op.substring]: value
                }
              });
            }
          }

          if (dbField.type === 'string' && ignoreField.indexOf(dbField.fieldName) < 0) {
            result[Op.or].push({
              [dbField.fieldName]: {
                [Op.substring]: filter.value
              }
            });
          }
        });

        /**
                 * Check UserId
                 * */
        const userIdIndex = _.findIndex(dbFields, {
          fieldName: 'user_id'
        });
        if (userIdIndex >= 0) {
          const users = await UserModel.findAll({
            attributes: ['id', 'email'],
            where: {
              fullname: {
                [Op.substring]: filter.value
              }
            },
            raw: true
          });

          const userIds = [];
          if (_.isEmpty(users) === false) {
            _.forEach(users, (user) => {
              userIds.push(user.id);
            });
            result[Op.or].push({
              user_id: {
                [Op.in]: userIds
              }
            });
          }
        }

        /**
                 * Check status
                 * */
        const releaseStatusIndex = _.findIndex(dbFields, {
          fieldName: 'release_status'
        });
        if (releaseStatusIndex >= 0) {
          let hasReleaseStatus = -1;
          _.forEach(releaseStatus, (status, index) => {
            const exist = status.toLowerCase().includes(filter.value.toString().toLowerCase());
            if (exist === true) {
              hasReleaseStatus = index;
            }
          });

          if (hasReleaseStatus >= 0) {
            result[Op.or].push({
              release_status: hasReleaseStatus
            });
          }
        }
        return result;
      }
      return {};
    } catch (error) {
      return [];
    }
  },

  FilterReleaseGroups: async (request) => {
    try {
      const {
        payload
      } = request;
      const keyword = _.get(payload, 'filters.keyword', null);

      if (_.isEmpty(keyword) === true) {
        const groups = await GroupsModel.findAll({
          where: {
            group_type: '1'
          },
          raw: true
        });
        return groups;
      }

      const groups = await GroupsModel.findAll({
        where: {
          group_type: '1',
          name: {
            [Op.substring]: keyword
          }
        },
        raw: true
      });

      return groups;
    } catch (error) {
      return [];
    }
  },

  GetGroupUsers: async (request) => {
    try {
      const condition = Private.FilterReleaseUsers(request);
      const conditionNoGroup = Private.FilterReleaseUsers(request, true);

      const data = await Private.GetUsersWithNoGroups(condition, conditionNoGroup);
      return data;
    } catch (error) {
      return [];
    }
  },

  FilterReleaseUsers: (request, isNoGroup = false) => {
    try {
      const {
        payload
      } = request;
      const conditionItems = _.pick(payload.filters, ['group_ids', 'group_type', 'keyword', 'account_type', 'subscription_type', 'last_used_start', 'last_used_end']);

      if (_.isEmpty(conditionItems) === true) {
        return '';
      }
      const result = [];
      if (_.isEmpty(conditionItems.group_ids) === false && isNoGroup === false) {
        const groupIds = _.map(conditionItems.group_ids.split(','), (item) => {
          return Number(item);
        });
        result.push(`g.id IN ("${groupIds.join(',')}")`);
      }

      if (_.isNumber(conditionItems.group_type) === true && isNoGroup === false) {
        result.push(`g.group_type = "${conditionItems.group_type}"`);
      }

      if (_.isEmpty(conditionItems.keyword) === false) {
        result.push(`((u.email LIKE '%${conditionItems.keyword}%' ) OR (sa.user_income LIKE '%${conditionItems.keyword}%' ))`);
      }

      if (_.isNumber(conditionItems.account_type) === true) {
        const accountType = App.ACCOUNT_TYPE_MAP[conditionItems.account_type];
        if (_.isNumber(accountType) === true) {
          result.push(`sa.account_type  = ${accountType}`);
        } else if (_.isEmpty(accountType) === false) {
          result.push(`sa.account_type IN (${accountType.join(',')})`);
        }
      }

      if (_.isNumber(conditionItems.subscription_type) === true) {
        const subscription = App.SUBSCRIPTION_TYPE_MAP[conditionItems.subscription_type];
        if (_.isEmpty(subscription) === false) {
          result.push(`sp.sub_id IN ("${subscription.join('","')}")`);
        }
      }

      if (_.isNumber(conditionItems.last_used_start) === true && _.isNumber(conditionItems.last_used_end) === true) {
        if (conditionItems.last_used_start <= conditionItems.last_used_end) {
          result.push(`uta.last_used_date BETWEEN ${conditionItems.last_used_start} AND ${conditionItems.last_used_end}`);
        }
      }

      return result.join(' AND ');
    } catch (error) {
      return [];
    }
  },

  GetUsersWithNoGroups: async (condition, conditionNoGroup) => {
    const selectQuery = `
                    SELECT DISTINCT u.email, u.id,
                    DATE(FROM_UNIXTIME(u.created_date)) as join_date,
                    u.fullname,
                    count(distinct sa.user_income) account_3rd,
                    if(q.username != '',q.bytes+q.cal_bytes+q.card_bytes+q.file_bytes, 0) storage,

                    GROUP_CONCAT(DISTINCT g.name ORDER BY g.id ASC SEPARATOR '/') as groups,
                    GROUP_CONCAT(DISTINCT sa.user_income ORDER BY sa.id ASC SEPARATOR '\n') as account_3rd_emails,

                    CASE
                        WHEN sc.subs_type = 1 THEN 'Premium'
                        WHEN sc.subs_type = 2 THEN 'Pro'
                        ELSE 'Standard'
                    END as subs_type,
                    if(sp.sub_id != '', sp.sub_id, '') as sub_id,
                    CASE
                        WHEN sc.order_number = 1 OR sc.order_number = 3 THEN 'Yearly'
                        WHEN sc.order_number = 2 OR sc.order_number = 4 THEN 'Monthly'
                        ELSE ''
                    END as subs_time,
                    max(uta.last_used_date) as last_used_date,

                    if(sp.created_date != 0, DATE(FROM_UNIXTIME(sp.created_date)), 0) as subs_current_date,
                    if(sp.created_date != 0, DATE_ADD(DATE(FROM_UNIXTIME(sp.created_date)), INTERVAL sc.period DAY), 0) as next_renewal
                    `;
    const fromQuery = `
                    FROM user u
                    LEFT JOIN third_party_account sa on sa.user_id = u.id
                    LEFT JOIN quota q on q.username = u.email
                    LEFT JOIN subscription_purchase sp on sp.user_id = u.id and sp.is_current = 1
                    LEFT JOIN subscription sc on sc.id = sp.sub_id

                    LEFT JOIN user_tracking_app uta on uta.user_id = u.id
                    LEFT JOIN tracking_app ta on ta.id = uta.user_id
                    `;

    let queryString = `
                ${selectQuery}
                ${fromQuery}
                INNER JOIN group_user gu on gu.user_id = u.id
                INNER JOIN \`group\` g on g.id = gu.group_id
                WHERE ${condition ? `${condition}` : '1'}
                GROUP BY u.email`;
    if (_.isEmpty(conditionNoGroup) === false) {
      queryString += ` UNION
                ${selectQuery}
                ${fromQuery}
                LEFT JOIN group_user gu on gu.user_id = u.id
                LEFT JOIN \`group\` g on g.id = gu.group_id
                WHERE u.id NOT IN (SELECT user_id FROM group_user GROUP BY group_user.user_id)
                AND ${conditionNoGroup}
                GROUP BY u.email
                `;
    }
    return UserModel.sequelize.query(queryString, {
      type: UserModel.sequelize.QueryTypes.SELECT
    }).then((result) => result || []);
  },

  CreateFloMacReleaseVersion: async (request, userId) => {
    try {
      const { payload } = request;
      const attributes = [
        'id', 'version', 'checksum', 'release_note', 'description',
        'file_name', 'file_uid', 'app_id', 'build_number'
      ];

      if (_.isEmpty(payload.checksum) === true) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Checksum is required']
          }
        };
      }

      if (_.isEmpty(payload.file_name) === true) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['file_name is required']
          }
        };
      }

      if (_.isEmpty(payload.file_uid) === true) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['file_uid is required']
          }
        };
      }
      if (_.isEmpty(payload.file_dsym_uid) === true) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['file_dsym_uid is required']
          }
        };
      }

      const existReleaseVersion = await ReleaseModel.findOne({
        attributes,
        where: {
          [Op.or]: [
            {
              [Op.and]: {
                version: payload.version,
                build_number: payload.build_number,
                app_id: payload.app_id
              }
            },
            {
              [Op.and]: {
                checksum: payload.checksum,
                app_id: payload.app_id
              }
            },
            {
              [Op.and]: {
                file_dsym_uid: payload.file_dsym_uid,
                app_id: payload.app_id
              }
            },
            {
              [Op.and]: {
                file_uid: payload.file_uid,
                app_id: payload.app_id
              }
            }
          ]
        },
        raw: true
      });

      if (_.isEmpty(existReleaseVersion) === false) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Release version already exist']
          }
        };
      }

      /**
       * Create release version
       */
      payload.release_status = payload.release_status || 0;
      const currentTimestamp = Utils.Timestamp();
      const result = await ReleaseModel.create({
        user_id: userId,
        version: payload.version,
        release_note: payload.release_note || '',
        description: payload.description || '',
        app_id: payload.app_id,
        build_number: payload.build_number,
        os_support: payload.os_support,
        release_time: payload.release_time || null,
        release_status: `${payload.release_status}`,
        release_type: payload.release_type.toString(),
        // File region
        checksum: payload.checksum || '',
        length: payload.length,
        length_dsym: payload.length_dsym,
        file_name: payload.file_name,
        file_dsym: payload.file_dsym,
        file_dsym_uid: payload.file_dsym_uid,
        file_uid: payload.file_uid,
        title: payload.title,
        message: payload.message,
        expire_date: payload.expire_date || 0,
        message_expire: payload.message_expire,
        // 
        created_date: currentTimestamp,
        updated_date: currentTimestamp
      });
      // trigger grab file & save S3
      setTimeout(() => {
        LastPartUploadTrigger(payload.file_uid, {
          isDsym: 0,
          id: result.id,
          message: 'save file_uid to db'
        });
        LastPartUploadTrigger(payload.file_dsym_uid, {
          isDsym: 1,
          id: result.id,
          message: 'save dsym_file_uid to db'
        });
      }, 1000);
      return result;
    } catch (error) {
      throw error;
    }
  },

  CreateDefaultReleaseVersion: async (request, userId) => {
    try {
      // 
      const { payload } = request;

      const attributes = [
        'id', 'version', 'checksum', 'release_note', 'description',
        'file_name', 'file_uid', 'app_id', 'build_number'
      ];

      const existReleaseVersion = await ReleaseModel.findOne({
        attributes,
        where: {
          version: payload.version,
          build_number: payload.build_number,
          app_id: payload.app_id
        },
        raw: true
      });

      if (_.isEmpty(existReleaseVersion) === false) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Release version already exist']
          }
        };
      }

      /**
       * Create release version
       */
      payload.release_status = payload.release_status || 0;
      const currentTimestamp = Utils.Timestamp();
      const result = await ReleaseModel.create({
        user_id: userId,
        version: payload.version,
        release_note: payload.release_note || '',
        description: payload.description || '',
        app_id: payload.app_id,
        build_number: payload.build_number,
        os_support: payload.os_support,
        release_time: payload.release_time || null,
        release_status: `${payload.release_status}`,
        release_type: payload.release_type.toString(),
        // File region
        checksum: '',
        length: 0,
        length_dsym: 0,
        file_name: '',
        file_dsym: '',
        file_dsym_uid: null,
        file_uid: null,
        upload_status: App.UPLOAD_STATUS.NOT_UPLOAD,
        url_download: payload.url_download,
        title: payload.title,
        message: payload.message,
        expire_date: payload.expire_date || 0,
        message_expire: payload.message_expire,
        created_date: currentTimestamp,
        updated_date: currentTimestamp
      });
      return result;
    } catch (error) {
      throw error;
    }
  },

  ModifyFloMacReleaseVersion: async (request, releaseVersion, attributes) => {
    try {
      const { payload, params } = request;
      const diff = Utils.GetObjectDiff(releaseVersion, payload);
      if (_.isEmpty(payload.checksum) === true) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid checksum']
          }
        };
      }

      const existReleaseVersion = await ReleaseModel.findOne({
        attributes,
        where: {
          version: payload.version,
          build_number: payload.build_number,
          app_id: payload.app_id,
          id: { [Op.ne]: params.id }
        },
        raw: true
      });

      if (_.isEmpty(existReleaseVersion) === false) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Release version already exist']
          }
        };
      }

      const query = {
        version: payload.version,
        build_number: payload.build_number,
        os_support: payload.os_support,
        release_type: payload.release_type.toString(),
        updated_date: Utils.Timestamp()
      };

      if (_.isEmpty(payload.description) === false) {
        query.description = payload.description;
      }

      if (_.isEmpty(payload.release_note) === false) {
        query.release_note = payload.release_note;
      }

      if (_.isNumber(payload.release_status) === true) {
        query.release_status = payload.release_status.toString();
      }

      if (_.isNumber(payload.release_time) === true) {
        query.release_time = payload.release_time;
      }

      if (_.isEmpty(payload.title) === false) {
        query.title = payload.title;
      }

      if (_.isEmpty(payload.message) === false) {
        query.message = payload.message;
      }

      if (_.isNumber(payload.expire_date) === true) {
        query.expire_date = payload.expire_date;
      }

      if (_.isEmpty(payload.message_expire) === false) {
        query.message_expire = payload.message_expire;
      }

      let removeFileDsym = false;
      if (diff.file_dsym_uid === true && _.isEmpty(payload.file_dsym_uid) === false) {
        removeFileDsym = true;
        query.file_dsym = payload.file_dsym;
        query.file_dsym_uid = payload.file_dsym_uid;
      }

      let removeFile = false;
      if (diff.file_uid === true && _.isEmpty(payload.file_uid) === false) {
        removeFile = true;
        query.file_uid = payload.file_uid;
        query.file_name = payload.file_name;
      }

      if (_.isEmpty(payload.checksum) === true) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid checksum']
          }
        };
      }
      if (_.isNumber(payload.length) === false || _.isNumber(payload.length_dsym) === false) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid length']
          }
        };
      }

      query.checksum = payload.checksum;
      query.length = payload.length;
      query.length_dsym = payload.length_dsym;

      // MAC not set url_download
      // if (payload.url_download && payload.url_download.trim() != '') {
      //   query.url_download = payload.url_download;
      // }
      // reset upload status after modify .dmg file
      const isChangeFileDmg = diff.file_uid && payload.file_uid.length;
      if (isChangeFileDmg) {
        query.upload_status = App.UPLOAD_STATUS.UPLOADING;
      }
      const result = await ReleaseModel.update(query, {
        where: {
          id: params.id
        }
      });

      const returnCode = result ? result[0] : 0;
      if (returnCode !== 1) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Update release version fail, please try again later!']
          }
        };
      }

      const release = await ReleaseModel.findOne({
        attributes,
        where: {
          id: params.id
        },
        include: [{
          model: UserModel,
          as: 'user'
        }],
        raw: true
      });

      //
      if (removeFile === true) {
        await Private.RemoveReleaseFiles(releaseVersion.file_uid, releaseVersion.file_name);
      }
      if (removeFileDsym === true) {
        await Private.RemoveReleaseFiles(releaseVersion.file_dsym_uid, releaseVersion.file_dsym);
      }
      // change file
      if (isChangeFileDmg) {
        // trigger grab file & save S3
        setTimeout(() => {
          LastPartUploadTrigger(payload.file_uid, {
            isDsym: 0,
            id: params.id,
            message: 'modify file to db'
          });
        }, 1000);
      }
      // change file dsym
      if (diff.file_dsym_uid && payload.file_dsym_uid.length) {
        // trigger grab file & save S3
        setTimeout(() => {
          LastPartUploadTrigger(payload.file_dsym_uid, {
            isDsym: 1,
            id: params.id,
            message: 'modify dsym to db'
          });
        }, 1000);
      }
      return release;
    } catch (error) {
      throw error;
    }
  },

  ModifyDefaultReleaseVersion: async (request, attributes) => {
    try {
      const { payload, params } = request;

      const existReleaseVersion = await ReleaseModel.findOne({
        attributes,
        where: {
          version: payload.version,
          build_number: payload.build_number,
          app_id: payload.app_id,
          id: { [Op.ne]: params.id }
        },
        raw: true
      });

      if (_.isEmpty(existReleaseVersion) === false) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Release version already exist']
          }
        };
      }

      const query = {
        version: payload.version,
        checksum: '',
        build_number: payload.build_number,
        os_support: payload.os_support,
        release_type: payload.release_type.toString(),
        updated_date: Utils.Timestamp()
      };

      if (_.isEmpty(payload.description) === false) {
        query.description = payload.description;
      }

      if (_.isEmpty(payload.release_note) === false) {
        query.release_note = payload.release_note;
      }

      if (_.isEmpty(payload.url_download) === false) {
        query.url_download = payload.url_download;
      }

      if (_.isNumber(payload.release_status) === true) {
        query.release_status = payload.release_status.toString();
      }

      if (_.isNumber(payload.release_time) === true) {
        query.release_time = payload.release_time;
      }

      if (_.isEmpty(payload.title) === false) {
        query.title = payload.title;
      }

      if (_.isEmpty(payload.message) === false) {
        query.message = payload.message;
      }

      if (_.isNumber(payload.expire_date) === true) {
        query.expire_date = payload.expire_date;
      }

      if (_.isEmpty(payload.message_expire) === false) {
        query.message_expire = payload.message_expire;
      }

      const result = await ReleaseModel.update(query, {
        where: {
          id: params.id
        }
      });

      const returnCode = result ? result[0] : 0;
      if (returnCode !== 1) {
        return {
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Update release version fail, please try again later!']
          }
        };
      }

      const release = await ReleaseModel.findOne({
        attributes,
        where: {
          id: params.id
        },
        include: [{
          model: UserModel,
          as: 'user'
        }],
        raw: true
      });
      return release;
    } catch (error) {
      throw error;
    }
  }

};

const GetReleaseVersions = async (request, h) => {
  try {
    const {
      query
    } = request;
    /**
     * Sort Field allow
     * >> Allow all for now
     * */
    const validSortField = ['id', 'build_number', 'release_status', 'release_time', 'created_date', 'updated_date'];
    const attributes = [
      'id', 'user_id', 'version', 'checksum', 'release_note', 'description',
      'file_name', 'file_uid', 'app_id', 'build_number',
      'title', 'message', 'expire_date', 'message_expire',
      'os_support', 'length', 'file_dsym', 'file_dsym_uid', 'length_dsym', 'url_download',
      'release_type', 'release_time', 'release_status', 'upload_status', 'created_date', 'updated_date'
    ];
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const where = await Private.FilterRelease(query) || {};

    if (_.isEmpty(query.app_ids) === false) {
      const appIds = _.uniq(query.app_ids.split(','));
      if (_.isEmpty(where[Op.or]) === true) {
        where[Op.or] = [];
      }
      where[Op.or].push({
        app_id: appIds
      });
    }

    const order = Utils.HandleSortSequelize(query.sort, validSortField);

    const releases = await ReleaseModel.findAndCountAll({
      attributes,
      where,
      include: [{
        model: UserModel,
        as: 'user'
      }],
      order,
      offset: paging.offset,
      limit: paging.limit,
      raw: true
    });

    const data = _.get(releases, 'rows', []);
    const totalRows = _.get(releases, 'count', 0);

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
        .code(Code.REQUEST_SUCCESS)
        .header('X-Total-Count', totalRows);
    }

    const result = [];
    const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
    const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
    const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
    const userIds = _.map(data, (item) => item.user_id);
    const deletedUsers = await UsersDeletedModel.findAll({
      where: {
        user_id: userIds
      },
      raw: true
    });

    _.forEach(data, (item) => {
      const deletedUser = _.find(deletedUsers, {
        user_id: item.user_id
      });
      const tmpData = _.clone(item);
      tmpData.owner = _.get(deletedUser, 'username', _.get(tmpData, 'user.email', ' ')) || ' ';
      tmpData.build_number = Number(item.build_number);
      tmpData.release_status = Number(item.release_status);
      tmpData.release_type = Number(item.release_type);
      tmpData.upload_status = Number(item.upload_status);
      tmpData.expire_date = Number(item.expire_date);
      tmpData.is_expired = (item.expire_date && item.expire_date * 1000 < Date.now()) ? 1 : 0;
      tmpData.url_dsym_file = '';
      tmpData.url_download = '';
      if (tmpData.upload_status === App.UPLOAD_STATUS.UPLOADED_SUCCESS) {
        tmpData.url_update_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, tmpData.file_uid);
        tmpData.url_dsym_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, tmpData.file_dsym_uid);
        tmpData.url_download = tmpData.url_update_file;
      } else {
        tmpData.url_update_file = !tmpData.file_uid ? '' : `/releases/${tmpData.id}/check_upload_status/${tmpData.file_uid}`;
      }
      result.push(_.pick(tmpData, [
        'id', 'version', 'checksum', 'release_note', 'description', 'file_name', 'file_uid', 'app_id',
        'build_number', 'os_support', 'length', 'file_dsym', 'file_dsym_uid', 'length_dsym', 'release_type',
        'title', 'message', 'expire_date', 'is_expired', 'message_expire',
        'release_time', 'release_status', 'upload_status',
        'created_date', 'updated_date', 'owner', 'url_update_file', 'url_dsym_file', 'url_download'
      ]));
    });

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: result
    })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows);
  } catch (error) {
    throw error;
  }
};

const GetReleaseVersion = async (request, h) => {
  try {
    const { params } = request;
    const attributes = [
      'id', 'user_id', 'version', 'checksum', 'release_note', 'description', 'file_name', 'file_uid', 'app_id', 'build_number',
      'os_support', 'length', 'file_dsym', 'file_dsym_uid', 'length_dsym', 'url_download', 'release_type', 'release_time', 'release_status',
      'title', 'message', 'expire_date', 'message_expire',
      'upload_status', 'created_date', 'updated_date'
    ];
    const data = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.id
      },
      include: [{
        model: UserModel,
        as: 'user'
      }]
    });

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }
    const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
    const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
    const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
    let owner = data?.user?.email;
    if (!owner) {
      const deletedUser = await UsersDeletedModel.findOne({
        where: {
          user_id: data.user_id
        },
        raw: true
      });
      owner = deletedUser?.username;
    }

    data.owner = owner;
    data.build_number = Number(data.build_number);
    data.release_status = Number(data.release_status);
    data.release_type = Number(data.release_type);
    data.upload_status = Number(data.upload_status);
    data.expire_date = Number(data.expire_date);
    data.is_expired = (data.expire_date && data.expire_date * 1000 < Date.now()) ? 1 : 0;
    data.url_dsym_file = '';
    data.url_download = '';
    if (data.upload_status === App.UPLOAD_STATUS.UPLOADED_SUCCESS) {
      data.url_update_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, data.file_uid);
      data.url_dsym_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, data.file_dsym_uid);
      data.url_download = data.url_update_file;
    } else {
      data.url_update_file = !data.file_uid ? '' : `/releases/${data.id}/check_upload_status/${data.file_uid}`;
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: _.pick(data, [
        'id', 'version', 'checksum', 'release_note', 'description', 'file_name', 'file_uid', 'app_id',
        'build_number', 'os_support', 'length', 'file_dsym', 'file_dsym_uid', 'length_dsym', 'release_type',
        'title', 'message', 'expire_date', 'is_expired', 'message_expire',
        'release_time', 'release_status', 'upload_status',
        'created_date', 'updated_date', 'owner', 'url_update_file', 'url_dsym_file', 'url_download'
      ])
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const CheckUploadStatus = async (request, h) => {
  try {
    const { params } = request;
    if (!params.id || params.file_uid === 'null') {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: 'Lack of required params'
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const Cache = require('../caches/Cache');
    const { generateFileUploadCacheKey } = require('../utilities/Utils');
    const cacheKey = generateFileUploadCacheKey(params.file_uid);
    const cache = await Cache.get(cacheKey);
    let data = null;
    if (cache === null) {
      data = await ReleaseModel.findOne({
        attributes: ['id', 'upload_status', 'file_uid'],
        where: { id: params.id },
        raw: true
      });
      await Cache.set(cacheKey, JSON.stringify({
        ...data,
        uuid: params.file_uid,
        upload_time: Date.now()
      }), 24 * 3600);
    } else {
      const cached = JSON.parse(cache);
      const maxUploadWaitingTime = new Date() - new Date(cached.upload_time) >= App.UPLOAD_STATUS.MAX_WAITING_TIME;
      // reach max waiting time
      if (cached.upload_status === App.UPLOAD_STATUS.UPLOADING && maxUploadWaitingTime) {
        await uploadStatusHandler(params.file_uid, {
          upload_status: App.UPLOAD_STATUS.UPLOAD_FAILED,
          message: 'failed to upload file'
        });
        return h.response({
          code: Code.REQUEST_SUCCESS,
          error: {
            id: params.id,
            upload_status: App.UPLOAD_STATUS.UPLOAD_FAILED,
            file_uid: params.file_uid,
            message: 'Upload failed'
          }
        }).code(Code.REQUEST_SUCCESS);
      }
      //
      data = {
        ...cached,
        file_uid: params.file_uid
      };
    }

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        id: data.id,
        upload_status: data.upload_status || App.UPLOAD_STATUS.UPLOADING,
        url_update_file: getDownloadUrlFromUID(data.upload_status, request, data.file_uid),
        file_uid: data.file_uid
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

function getDownloadUrlFromUID(upload_status, request, file_uid) {
  if (upload_status !== App.UPLOAD_STATUS.UPLOADED_SUCCESS) { return ''; }
  const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
  const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
  const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
  return Utils.GenerateDownloadUrl(appId, deviceUid, token, file_uid);
}

/**
 * Admin can upload/release new Flo app version
 * Step by step
    check/validate parameters: version, checksum, file . Return error code if parameter is invalid
    check duplicate version of Flo app, key to validate duplicate: version, checksum. Return error if it was existed
    Get file_name
    auto generate file_uid
    insert data into DB and upload file to server
    response create successful
 */

const CreateReleaseVersion = async (request, h) => {
  try {
    const { payload } = request;
    const userInfo = _.get(request, 'auth.credentials', false);

    if (_.isEmpty(payload.version) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid version format']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const appRegister = await AppRegisterModel.findOne({
      where: {
        app_reg_id: payload.app_id
      },
      raw: true
    });

    if (_.isEmpty(appRegister) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid app_id']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    /**
         * Check app name
         * If app_name === Flo Mac >> normal 
         * Else do not check file information
         *    File info will be empty string
         */

    /**
         * Check exist
         */

    let result = {};

    if (appRegister.app_reg_id === 'ad944424393cf309efaf0e70f1b125cb') { // FloMac
      result = await Private.CreateFloMacReleaseVersion(request, userInfo.user_id);
    } else if (appRegister.app_reg_id === 'faf0e70f1bad944424393cf309e125cb' || appRegister.app_reg_id === 'd944424393cf309e125cbfaf0e70f1ba') { // Other platforms
      result = await Private.CreateDefaultReleaseVersion(request, userInfo.user_id);
    }

    /**
     * Return error
     */
    if (_.isNumber(result.code) === true) {
      return h.response(result).code(result.code);
    }
    const rawData = result.toJSON();

    rawData.owner = _.get(userInfo, 'email', ' ');
    rawData.build_number = Number(rawData.build_number);
    rawData.release_status = Number(rawData.release_status);
    rawData.release_type = Number(rawData.release_type);
    rawData.upload_status = Number(rawData.upload_status);
    rawData.expire_date = Number(rawData.expire_date);
    rawData.is_expired = (rawData.expire_date && rawData.expire_date * 1000 < Date.now()) ? 1 : 0;
    rawData.url_dsym_file = '';
    if (appRegister.app_reg_id === 'ad944424393cf309efaf0e70f1b125cb') { // FloMac
      const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
      const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
      const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
      if (rawData.upload_status === App.UPLOAD_STATUS.UPLOADED_SUCCESS) {
        rawData.url_update_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, rawData.file_uid);
        rawData.url_dsym_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, rawData.file_dsym_uid);
        // rawData.url_download = rawData.url_update_file;
      } else {
        rawData.url_update_file = !rawData.file_uid ? '' : `/releases/${rawData.id}/check_upload_status/${rawData.file_uid}`;
      }
    }

    const data = _.pick(rawData, ['id',
      'owner', 'version', 'checksum', 'release_note',
      'description', 'release_type', 'file_uid',
      'url_update_file', 'app_id', 'build_number',
      'os_support', 'length', 'file_dsym', 'length_dsym',
      'file_dsym_uid', 'url_dsym_file', 'file_name', 'url_download',
      'title', 'message', 'expire_date', 'is_expired', 'message_expire',
      'release_time', 'release_status', 'created_date', 'updated_date'
    ]);

    return h.response({
      code: Code.CREATE_SUCCESS,
      data
    }).code(Code.CREATE_SUCCESS);
  } catch (error) {
    throw error;
  }
};

/**
 * Admin can update some changes  of Flo app release
 * Step by step [developer]:
    check/validate parameters: version, checksum, file . Return error code if parameter is invalid
    check duplicate version of Flo app, key to validate duplicate: version, checksum. Return error if it was existed
    read file and get file_name
    delete old file (if have)
    auto generate file_uid
    update data into DB and upload file to server
    response create successful
 */

const ModifyReleaseVersion = async (request, h) => {
  try {
    const { payload, params } = request;
    if (_.isEmpty(payload.version) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid version format']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const attributes = [
      'id', 'user_id', 'version', 'checksum', 'release_note', 'description',
      'file_name', 'file_uid', 'app_id', 'build_number',
      'os_support', 'length', 'file_dsym', 'file_dsym_uid', 'length_dsym',
      'url_download', 'release_type', 'release_time', 'release_status',
      'title', 'message', 'expire_date', 'message_expire',
      'created_date', 'updated_date'
    ];
    const releaseVersion = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.id,
        app_id: payload.app_id
      },
      raw: true
    });

    if (_.isEmpty(releaseVersion) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const appRegister = await AppRegisterModel.findOne({
      where: {
        app_reg_id: payload.app_id
      },
      raw: true
    });

    if (_.isEmpty(appRegister) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid app_id']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    let result = {};
    if (appRegister.app_reg_id === 'ad944424393cf309efaf0e70f1b125cb') { // FloMac
      result = await Private.ModifyFloMacReleaseVersion(request, releaseVersion, attributes);
    } else if (appRegister.app_reg_id === 'faf0e70f1bad944424393cf309e125cb' || appRegister.app_reg_id === 'd944424393cf309e125cbfaf0e70f1ba') { // Other platforms
      result = await Private.ModifyDefaultReleaseVersion(request, attributes);
    }

    /**
     * Return error
     */
    if (_.isNumber(result.code) === true) {
      return h.response(result).code(result.code);
    }
    const owner = _.get(result, 'user.email', false);
    if (!owner) {
      const deletedUser = await UsersDeletedModel.findOne({
        where: {
          user_id: result.user_id
        },
        raw: true
      });
      owner = _.get(deletedUser, 'username', '');
    }
    result.owner = owner;
    result.build_number = Number(result.build_number);
    result.release_status = Number(result.release_status);
    result.release_type = Number(result.release_type);
    result.expire_date = Number(result.expire_date || 0);
    result.is_expired = (result.expire_date && result.expire_date * 1000 < Date.now()) ? 1 : 0;
    result.url_update_file = `/releases/${params.id}/check_upload_status/${result.file_uid}`;
    result.url_dsym_file = '';
    if (appRegister.app_reg_id === 'ad944424393cf309efaf0e70f1b125cb') { // FloMac
      const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
      const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
      const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
      if (result.upload_status === App.UPLOAD_STATUS.UPLOADED_SUCCESS) {
        result.url_update_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, result.file_uid);
        result.url_dsym_file = Utils.GenerateDownloadUrl(appId, deviceUid, token, result.file_dsym_uid);
      }
    }
    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: _.pick(result, [
        'id', 'version', 'checksum', 'release_note', 'description', 'file_name', 'file_uid', 'app_id',
        'build_number', 'os_support', 'length', 'file_dsym', 'file_dsym_uid', 'length_dsym',
        'release_type', 'title', 'message', 'expire_date', 'is_expired', 'message_expire',
        'release_time', 'release_status', 'created_date', 'updated_date',
        'owner', 'url_update_file', 'url_dsym_file', 'url_download'
      ])
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

/**
 * Allow admin delete one version in admin page
 * Step by step [developer]:
    check item Flo app release exist. Return error code if does not exist
    delete this item
    response successful
 */

const DeleteReleaseVersion = async (request, h) => {
  try {
    const {
      params
    } = request;
    const attributes = [
      'id', 'version', 'checksum',
      'file_name', 'file_uid', 'app_id', 'build_number',
      'os_support', 'file_dsym', 'file_dsym_uid',
      'release_type', 'release_time', 'release_status',
      'created_date', 'updated_date'
    ];

    const releaseVersion = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.id
      },
      raw: true
    });
    if (_.isEmpty(releaseVersion) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }
    /**
     * Delete relation table record
     */
    const releaseGroup = await ReleaseGroupModel.findOne({
      where: {
        id: params.id
      },
      raw: true
    });
    if (_.isEmpty(releaseGroup) === false) {
      await ReleaseGroupModel.destroy({
        where: {
          release_id: params.id
        }
      });
    }
    const releaseUser = await ReleaseUserModel.findOne({
      attributes: ['id', 'release_id', 'user_id', 'created_date', 'updated_date'],
      where: {
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(releaseUser) === false) {
      await ReleaseUserModel.destroy({
        where: {
          release_id: params.id
        }
      });
    }

    const platformReleasePushNotifications = await PlatformReleasePushNotificationsModel.findOne({
      attributes: ['base_release_id', 'destination_release_id'],
      where: {
        [Op.or]: [
          { base_release_id: params.id },
          { destination_release_id: params.id }
        ]
      },
      raw: true
    });

    if (_.isEmpty(platformReleasePushNotifications) === false) {
      await PlatformReleasePushNotificationsModel.destroy({
        where: {
          [Op.or]: [
            { base_release_id: params.id },
            { destination_release_id: params.id }
          ]
        }
      });
    }

    const isDeleted = await ReleaseModel.destroy({
      where: {
        id: releaseVersion.id
      }
    });

    if (isDeleted === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Remove release version fail, please try again later !']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    Private.RemoveReleaseFiles(releaseVersion.file_uid, releaseVersion.file_name);
    Private.RemoveReleaseFiles(releaseVersion.file_dsym_uid, releaseVersion.file_dsym);

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

const GetReleaseGroups = async (request, h) => {
  try {
    const {
      query,
      params
    } = request;
    const attributes = [
      'id'
    ];
    const release = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(release) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const order = [
      ['created_date', 'DESC']
    ];

    const releases = await ReleaseGroupModel.findAndCountAll({
      attributes: [],
      where: {
        release_id: release.id
      },
      include: [{
        model: GroupsModel,
        attributes: ['id', 'name', 'description'],
        as: 'group',
        require: false
      }],
      order,
      offset: paging.offset,
      limit: paging.limit,
      raw: true
    });

    const data = _.get(releases, 'rows', []);
    const totalRows = _.get(releases, 'count', 0);

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
        .code(Code.REQUEST_SUCCESS)
        .header('X-Total-Count', totalRows);
    }

    const result = [];

    _.forEach(data, (item) => {
      result.push({
        id: item['group.id'],
        name: item['group.name'],
        description: item['group.description']
      });
    });

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: result
    })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows);
  } catch (error) {
    throw error;
  }
};

const GetReleaseUsers = async (request, h) => {
  try {
    const {
      query,
      params
    } = request;
    const attributes = [
      'id',
    ];

    const release = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(release) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const order = [
      ['created_date', 'DESC']
    ];

    const releases = await ReleaseUserModel.findAndCountAll({
      attributes: [],
      where: {
        release_id: release.id
      },
      include: [{
        model: UserModel,
        attributes: ['email', 'fullname'],
        as: 'user'
      }],
      order,
      offset: paging.offset,
      limit: paging.limit,
      raw: true
    });
    const data = _.get(releases, 'rows', []);
    const totalRows = _.get(releases, 'count', 0);

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
        .code(Code.REQUEST_SUCCESS)
        .header('X-Total-Count', totalRows);
    }

    const result = [];
    _.forEach(data, (item) => {
      result.push({
        email: item['user.email'],
        fullname: item['user.fullname']
      });
    });
    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: result
    }).code(Code.REQUEST_SUCCESS).header('X-Total-Count', totalRows);
  } catch (error) {
    throw error;
  }
};

const CreateReleaseUsers = async (request, h) => {
  try {
    const {
      payload,
      params,
      auth
    } = request;

    const email = _.get(auth, 'credentials.email', false);
    if (email === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid account']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const attributes = [
      'id',
    ];
    const release = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(release) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const targetUserIds = [];
    const insertArgs = [];
    let users = [];

    if (payload.type === 1) {
      users = await Private.GetGroupUsers(request);

      if (_.isEmpty(users) === true) {
        return h.response({
          code: Code.INVALID_SERVICE,
          error: {
            message: 'User doesn\'t exist'
          }
        }).code(Code.INVALID_SERVICE);
      }
    } else {
      const emails = payload.emails.map((item) => {
        return item.trim();
      });
      if (_.isEmpty(emails) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid email']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      users = await UserModel.findAll({
        where: {
          email: emails
        },
        raw: true
      });

      if (_.isEmpty(users) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid email']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    if (_.isEmpty(users) === false) {
      _.forEach(users, (item) => {
        targetUserIds.push(item.id);
      });

      const releaseUsers = await ReleaseUserModel.findAll({
        attributes: ['id', 'release_id', 'user_id', 'created_date', 'updated_date'],
        where: {
          release_id: release.id,
          user_id: targetUserIds
        },
        raw: true
      });

      _.forEach(targetUserIds, (userId) => {
        const releaseUser = _.find(releaseUsers, {
          release_id: release.id,
          user_id: userId
        });
        if (_.isEmpty(releaseUser) === true) {
          const currentTimestamp = Utils.Timestamp();
          insertArgs.push({
            user_id: userId,
            release_id: release.id,
            created_date: currentTimestamp,
            updated_date: currentTimestamp
          });
        }
      });

      if (_.isEmpty(insertArgs) === false) {
        await ReleaseUserModel.bulkCreate(insertArgs);
      }
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Create users release success'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    console.log('', error);

    throw error;
  }
};

const ModifyReleaseUsers = async (request, h) => {
  try {
    const {
      payload,
      params,
      auth
    } = request;
    const email = _.get(auth, 'credentials.email', false);
    if (email === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid account']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const attributes = [
      'id',
    ];
    const release = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(release) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const targetUserIds = [];
    const insertArgs = [];
    let users = [];

    if (payload.type === 1) {
      users = await Private.GetGroupUsers(request);
      if (_.isEmpty(users) === true) {
        return h.response({
          code: Code.INVALID_SERVICE,
          error: {
            message: 'User doesn\'t exist'
          }
        }).code(Code.INVALID_SERVICE);
      }
    } else {
      const emails = payload.emails.map((item) => {
        return item.trim();
      });
      if (_.isEmpty(emails) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid email']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      users = await UserModel.findAll({
        where: {
          email: emails
        },
        raw: true
      });
      if (_.isEmpty(users) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid email']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    if (_.isEmpty(users) === false) {
      _.forEach(users, (item) => {
        targetUserIds.push(item.id);
      });

      const releaseUsers = await ReleaseUserModel.findAll({
        attributes: ['id', 'release_id', 'user_id', 'created_date', 'updated_date'],
        where: {
          release_id: release.id,
          user_id: targetUserIds
        },
        raw: true
      });

      _.forEach(targetUserIds, (userId) => {
        const releaseUser = _.find(releaseUsers, {
          release_id: release.id,
          user_id: userId
        });
        if (_.isEmpty(releaseUser) === true) {
          const currentTimestamp = Utils.Timestamp();
          insertArgs.push({
            user_id: userId,
            release_id: release.id,
            created_date: currentTimestamp,
            updated_date: currentTimestamp
          });
        }

        if (_.isEmpty(releaseUser) === false) {
          insertArgs.push({
            user_id: userId,
            release_id: release.id,
            created_date: releaseUser.created_date,
            updated_date: Utils.Timestamp()
          });
        }
      });

      if (_.isEmpty(insertArgs) === false) {
        await ReleaseUserModel.sequelize.transaction((t) => {
          const where = {
            release_id: release.id
          };
          return ReleaseUserModel.destroy({
            where
          }, {
            transaction: t
          }).then(() => {
            return ReleaseUserModel.bulkCreate(insertArgs, {
              transaction: t
            }).then(() => {
              return true;
            }).catch(() => {
              return h.response({
                code: Code.INVALID_PAYLOAD_PARAMS,
                data: {
                  message: ['Modify users release fail']
                }
              }).code(Code.REQUEST_SUCCESS);
            });
          }).catch(() => {
            return h.response({
              code: Code.INVALID_PAYLOAD_PARAMS,
              data: {
                message: ['Modify users release fail']
              }
            }).code(Code.REQUEST_SUCCESS);
          });
        });
      }
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Modify users release success'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const CreateReleaseGroups = async (request, h) => {
  try {
    const {
      payload,
      params,
      auth
    } = request;
    const email = _.get(auth, 'credentials.email', false);
    if (email === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid account']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const attributes = [
      'id',
    ];

    const release = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(release) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release version doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const targetGroupIds = [];
    const insertArgs = [];
    let groups = [];

    if (payload.type === 1) {
      groups = await Private.FilterReleaseGroups(request);
      if (_.isEmpty(groups) === true) {
        return h.response({
          code: Code.INVALID_SERVICE,
          error: {
            message: 'Group doesn\'t exist'
          }
        }).code(Code.INVALID_SERVICE);
      }
    } else {
      if (_.isEmpty(payload.group_ids) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid group']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      groups = await GroupsModel.findAll({
        where: {
          id: payload.group_ids
        },
        raw: true
      });

      if (_.isEmpty(groups) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid group']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    if (_.isEmpty(groups) === false) {
      _.forEach(groups, (item) => {
        targetGroupIds.push(item.id);
      });

      const releaseGroups = await ReleaseGroupModel.findAll({
        where: {
          release_id: release.id,
          group_id: targetGroupIds
        },
        raw: true
      });

      _.forEach(targetGroupIds, (groupId) => {
        const releaseGroup = _.find(releaseGroups, {
          release_id: release.id,
          group_id: groupId
        });

        if (_.isEmpty(releaseGroup) === true) {
          const currentTimestamp = Utils.Timestamp();
          insertArgs.push({
            group_id: groupId,
            release_id: release.id,
            created_date: currentTimestamp,
            updated_date: currentTimestamp
          });
        }
      });

      if (_.isEmpty(insertArgs) === false) {
        await ReleaseGroupModel.bulkCreate(insertArgs);
      }
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Create group release success'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const ModifyReleaseGroups = async (request, h) => {
  try {
    const {
      payload,
      params,
      auth
    } = request;
    const email = _.get(auth, 'credentials.email', false);
    if (email === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid account']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const attributes = [
      'id',
    ];

    const release = await ReleaseModel.findOne({
      attributes,
      where: {
        id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(release) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const targetGroupIds = [];
    const insertArgs = [];
    let groups = [];

    if (payload.type === 1) {
      groups = await Private.FilterReleaseGroups(request);
      if (_.isEmpty(groups) === true) {
        return h.response({
          code: Code.INVALID_SERVICE,
          error: {
            message: 'Group doesn\'t exist'
          }
        }).code(Code.INVALID_SERVICE);
      }
    } else {
      if (_.isEmpty(payload.group_ids) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid group']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      groups = await GroupsModel.findAll({
        where: {
          id: payload.group_ids,
          group_type: '1'
        },
        raw: true
      });

      if (_.isEmpty(groups) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid group']
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    if (_.isEmpty(groups) === false) {
      _.forEach(groups, (item) => {
        targetGroupIds.push(item.id);
      });

      const releaseGroups = await ReleaseGroupModel.findAll({
        where: {
          release_id: release.id,
          group_id: targetGroupIds
        },
        raw: true
      });

      _.forEach(targetGroupIds, (groupId) => {
        const releaseGroup = _.find(releaseGroups, {
          release_id: release.id,
          group_id: groupId
        });

        if (_.isEmpty(releaseGroup) === true) {
          const currentTimestamp = Utils.Timestamp();
          insertArgs.push({
            group_id: groupId,
            release_id: release.id,
            created_date: currentTimestamp,
            updated_date: currentTimestamp
          });
        }

        if (_.isEmpty(releaseGroup) === false) {
          insertArgs.push({
            group_id: groupId,
            release_id: release.id,
            created_date: releaseGroup.created_date,
            updated_date: Utils.Timestamp()
          });
        }
      });

      if (_.isEmpty(insertArgs) === false) {
        await ReleaseGroupModel.sequelize.transaction((t) => {
          const where = {
            release_id: release.id
          };
          return ReleaseGroupModel.destroy({
            where
          }, {
            transaction: t
          }).then(() => {
            return ReleaseGroupModel.bulkCreate(insertArgs, {
              transaction: t
            }).then(() => {
              return true;
            }).catch(() => {
              return h.response({
                code: Code.INVALID_PAYLOAD_PARAMS,
                data: {
                  message: ['Modify group release fail']
                }
              }).code(Code.INVALID_PAYLOAD_PARAMS);
            });
          }).catch(() => {
            return h.response({
              code: Code.INVALID_PAYLOAD_PARAMS,
              data: {
                message: ['Modify group release fail']
              }
            }).code(Code.INVALID_PAYLOAD_PARAMS);
          });
        });
      }
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        message: 'Modify group release success'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    return h.response({
      code: Code.INVALID_PAYLOAD_PARAMS,
      error: {
        message: ['Invalid data']
      }
    }).code(Code.INVALID_PAYLOAD_PARAMS);
  }
};

const DeleteReleaseGroup = async (request, h) => {
  try {
    const {
      params
    } = request;
    const role = _.get(request, 'auth.credentials.role', false);

    if (role === 0) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const isExist = await ReleaseGroupModel.findOne({
      where: {
        release_id: params.release_id,
        group_id: params.group_id
      }
    });

    if (_.isEmpty(isExist) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release group doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const isDeleted = await ReleaseGroupModel.destroy({
      where: {
        release_id: params.release_id,
        group_id: params.group_id
      }
    });
    if (isDeleted === 0) {
      return h.response({
        code: Code.NOT_FOUND,
        error: {
          message: 'Not found'
        }
      }).code(Code.NOT_FOUND);
    }

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

const DeleteReleaseGroups = async (request, h) => {
  try {
    const {
      params
    } = request;
    const role = _.get(request, 'auth.credentials.role', 0);
    if (role === 0) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const isExist = await ReleaseGroupModel.findOne({
      where: {
        release_id: params.release_id
      },
      raw: true
    });

    if (_.isEmpty(isExist) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release group doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const isDeleted = await ReleaseGroupModel.destroy({
      where: {
        release_id: params.release_id
      }
    });

    if (isDeleted === 0) {
      return h.response({
        code: Code.NOT_FOUND,
        error: {
          message: 'Not found'
        }
      }).code(Code.NOT_FOUND);
    }

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

const DeleteReleaseUser = async (request, h) => {
  try {
    const {
      params
    } = request;
    const role = _.get(request, 'auth.credentials.role', 0);

    if (role === 0) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const user = await UserModel.findOne({
      where: {
        email: params.email
      },
      raw: true
    });
    if (_.isEmpty(user)) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'User doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const isExist = await ReleaseUserModel.findOne({
      attributes: ['id', 'release_id', 'user_id', 'created_date', 'updated_date'],
      where: {
        release_id: params.release_id,
        user_id: user.id
      }
    });

    if (_.isEmpty(isExist) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release user doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const isDeleted = await ReleaseUserModel.destroy({
      where: {
        release_id: params.release_id,
        user_id: user.id
      }
    });

    if (isDeleted === 0) {
      return h.response({
        code: Code.NOT_FOUND,
        error: {
          message: 'Not found'
        }
      }).code(Code.NOT_FOUND);
    }

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

const DeleteReleaseUsers = async (request, h) => {
  try {
    const {
      params
    } = request;
    const role = _.get(request, 'auth.credentials.role', 0);

    if (role === 0) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const isExist = await ReleaseUserModel.findOne({
      attributes: ['id', 'release_id', 'user_id', 'created_date', 'updated_date'],
      where: {
        release_id: params.release_id
      }
    });

    if (_.isEmpty(isExist) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release user doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const isDeleted = await ReleaseUserModel.destroy({
      where: {
        release_id: params.release_id
      }
    });

    if (isDeleted === 0) {
      return h.response({
        code: Code.NOT_FOUND,
        error: {
          message: 'Not found'
        }
      }).code(Code.NOT_FOUND);
    }

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

const Upload = async (request, h) => {
  try {
    const {
      payload
    } = request;
    const pathUpload = `${PATH_UPLOAD}/${AUTO_UPDATE_PATH}`;
    const localPathUpload = `${PATH_UPLOAD}/${AUTO_UPDATE_LOCAL_PATH}`;
    const allowFileTypes = ['zip'];
    const handleUpload = await HandleUpload(payload, localPathUpload, pathUpload, allowFileTypes);
    if (handleUpload.status === false) {
      return h.response({
        status: handleUpload.status,
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: [_.get(handleUpload, 'message', 'Uploading file failed! Write a file with errors or a file uploaded with the wrong size')]
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }
    if (handleUpload.status === 'done') {
      // const keyApi = _.get(request, 'auth.credentials.access_token', false);
      // const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
      // const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
      // const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
      // const url = Utils.GenerateDownloadUrl(appId, deviceUid, token, handleUpload.fileUid);
      // save uuid processing to db

      return h.response({
        code: Code.REQUEST_SUCCESS,
        status: handleUpload.status,
        data: {
          fileName: payload.file.hapi.filename,
          fileUid: handleUpload.fileUid,
          length: handleUpload.length,
          message: 'Upload file successfully'
        }
      }).code(Code.REQUEST_SUCCESS);
    }
    return h.response({
      code: Code.UPLOADING,
      status: handleUpload.status,
      data: {
        fileName: payload.file.hapi.filename,
        fileUid: handleUpload.fileUid,
        length: handleUpload.length,
        message: 'File upload is in processing'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const Downloads = async (request, h) => {
  try {
    const {
      query
    } = request;
    let result = {};
    switch (query.type) {
      case 'auto_update': {
        result = await Private.DownloadAutoUpdate(request);
        break;
      }
      default:
        break;
    }
    if (_.isEmpty(result) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Invalid request'
        }
      }).code(Code.INVALID_SERVICE);
    }
    if (result.code === 0) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: result.message
        }
      }).code(Code.INVALID_SERVICE);
    }
    return h.redirect(result.file);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetReleaseVersions,
  GetReleaseVersion,
  CreateReleaseVersion,
  ModifyReleaseVersion,
  DeleteReleaseVersion,
  //
  GetReleaseGroups,
  GetReleaseUsers,

  CreateReleaseUsers,
  CreateReleaseGroups,

  ModifyReleaseUsers,
  ModifyReleaseGroups,

  DeleteReleaseGroup,
  DeleteReleaseGroups,

  DeleteReleaseUser,
  DeleteReleaseUsers,
  //
  Upload,
  Downloads,
  CheckUploadStatus
};
