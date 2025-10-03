const _ = require('lodash');
const Moment = require('moment');
const validator = require('validator');
const path = require('path');
const queryString = require('query-string');
const { Op, literal } = require('sequelize');
const CSVStringify = require('csv-stringify');
const Fs = require('fs');
const Path = require('path');
const { v4: uuidv4 } = require('uuid');
const { randomBytes } = require('crypto');
const AppConstant = require('../constants/AppsConstant');
const { APP_NAME, USER_MIGRATE_DATA_CACHE } = require('../constants/AppsConstant');

const Utils = {
  UniqueIdByDate: () => {
    const time = Date.now();
    return `${uuidv4()}-${time}`;
  },

  ParseFolder: (uuid) => {
    const arrUid = uuid.split('-');
    const lastIndex = arrUid.length - 1;
    // eslint-disable-next-line radix
    const formateFolder = Moment(parseInt(arrUid[lastIndex])).format('YYYY/MM/DD');
    return formateFolder;
  },
  ParseUserId: (userId) => {
    const number = userId.toLocaleString();
    const numberArr = number.split(',');
    const result = ['0', '0', '0', '0'];
    _.forEach(numberArr, (item, i) => {
      const index = (result.length) - numberArr.length + i;
      result[index] = Number(item);
    });
    return result.join('/');
  },
  ObjToString: (object) => {
    let str = '';
    str += _.map(object, (i) => {
      return i;
    });
    return str;
  },
  SortObjectByKey: (object) => {
    const ordered = {};
    Object.keys(object).sort().forEach((key) => {
      ordered[key] = object[key];
    });
    return ordered;
  },
  RemoveKeyOfObject: (object, prop) => {
    const newObject = Object.keys(object).reduce((obj, key) => {
      if (key !== prop) {
        // eslint-disable-next-line no-param-reassign
        obj[key] = object[key];
      }
      return obj;
    }, {});
    return newObject;
  },
  GenerateUrl: (params) => {
    const arrParams = params;
    return queryString.stringify(arrParams);
  },
  GeneratePath: (params) => {
    const arrParams = params;
    const signature = Utils.Signature(arrParams);
    arrParams.signature = signature;
    return queryString.stringify(arrParams);
  },
  HandlePaging: (pageNum, maxRow) => {
    try {
      if (_.isNumber(pageNum) === true && _.isNumber(maxRow) === true) {
        if (pageNum > 0 && maxRow > 0) {
          return {
            limit: maxRow,
            offset: (pageNum - 1) * maxRow
          };
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  },
  // format 1568269168.587
  Timestamp: (millisecond = Date.now()) => {
    try {
      if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
        return millisecond / 1000;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  GenerateDownloadUrl: (appId, deviceUid, token, uuid) => {
    if (_.isEmpty(uuid) === true) {
      return '';
    }
    const params = {
      app_id: appId,
      device_uid: deviceUid,
      token,
      uuid,
      type: 'auto_update'
    };
    const stringQuery = Utils.GenerateUrl(params);
    const url = `${process.env.BASE_URL_DOWNLOAD}/downloads?${stringQuery}`;
    return url;
  },

  isValidDate: (str) => {
    const d = Moment(str, 'D/M/YYYY');
    if (d == null || !d.isValid()) return false;

    return str.indexOf(d.format('D/M/YYYY')) >= 0
      || str.indexOf(d.format('DD/MM/YYYY')) >= 0
      || str.indexOf(d.format('D/M/YY')) >= 0
      || str.indexOf(d.format('DD/MM/YY')) >= 0;
  },

  isValidDateTime: (str) => {
    const d = Moment(str, 'D/M/YYYY HH:mm:ss');
    if (d == null || !d.isValid()) return false;

    return str.indexOf(d.format('D/M/YYYY HH:mm:ss')) >= 0
      || str.indexOf(d.format('DD/MM/YYYY HH:mm:ss')) >= 0
      || str.indexOf(d.format('D/M/YY HH:mm:ss')) >= 0
      || str.indexOf(d.format('DD/MM/YY HH:mm:ss')) >= 0;
  },

  /**
     * HandleFilterToAttr : Check & return string type,value
     * Input : (String) filter
     * OutPut : (Object) 
     *          (String) type : date/dateTime, string or number
     *          (datetime, string , number)  value : format input string to new type
     * Handle : 
     *      Check String type such as  : date, string or number
     *      If  Input type is Date/dateTime >>  return type : date/dateTime , value :  {default,start,end}
     *      If  Input type is number >> return type : number , value : number
     *      If  Input type is string >> return type : string , value : string
     *             
     * */
  HandleFilterToAttr: (str) => {
    try {
      if (_.isEmpty(str) === true) {
        return false;
      }

      const filter = _.trim(str);
      const result = {
        type: 'string',
        value: filter
      };

      const isDate = Utils.isValidDate(filter);
      const isNumber = validator.isNumeric(filter);
      if (isNumber === true) {
        result.type = 'number';
        result.value = Number(filter);
      }

      if (isDate === true) {
        const dateFormatYMD = filter.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/);
        const dateFormatDMY = filter.match(/^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/i);
        if (dateFormatYMD === null && dateFormatDMY === null) {
          return false;
        }
        let year;
        let month;
        let day;
        if (dateFormatYMD !== null) {
          [year, month, day] = dateFormatYMD[0].split('-');
        }
        if (dateFormatDMY !== null) {
          [day, month, year] = dateFormatDMY[0].split('/');
        }
        month = (Number(month) - 1).toString();
        result.type = 'date';
        result.value = {
          start: new Date(year, month, day, 0, 0, 0).getTime() / 1000,
          end: new Date(year, month, day, 23, 59, 59).getTime() / 1000
        };
      }
      return result;
    } catch (error) {
      return false;
    }
  },

  /**
     * Sorting
     * Input : (String) sort include type sort and field sort >> ex : -id,+title
     * OutPut : (Array object) 
     *          type : ASC,DESC
     *          field : field name
     * Handle : 
     *      Split [,] of string if [,] avaiable
     *      Split frist character of string to two item
     *          Frist item is type of sort :  [+] mean ASC, [-] mean DESC
     *          Second item is field name
     *             
     * */

  HandlePureSort: (sort, validSortField = []) => {
    const result = [];
    try {
      if (_.isEmpty(sort) === true) {
        return result;
      }

      const sortArr = sort.split(',');
      if (_.isEmpty(sortArr) === true) {
        return false;
      }

      const types = {
        '+': 'ASC',
        '-': 'DESC'
      };
      _.forEach(sortArr, (item) => {
        const sortFieldArr = item[0].split(' ');
        let type = types[item[0]];

        let field = _.trim(item.slice(1));
        if (_.isUndefined(type) === true) {
          field = _.trim(item);
        }

        if (sortFieldArr.length === 2 || _.isUndefined(type) === true) {
          type = 'ASC';
        }

        if (_.isEmpty(type) === false && item.length > 2) {
          // const field = _.trim(item.slice(1));
          const isValidField = _.isEmpty(validSortField) ? true : _.indexOf(validSortField, field) >= 0;
          if (isValidField === true) {
            const isExist = _.find(result, field);
            if (_.isEmpty(isExist) === true) {
              result.push(`${field} ${type}`);
            }
          }
        }
      });
      return result || [];
    } catch (error) {
      return result;
    }
  },

  HandleSortSequelize: (sort, validSortField = []) => {
    const result = [];
    try {
      if (_.isEmpty(sort) === true) {
        return result;
      }

      const sortArr = sort.split(',');
      if (_.isEmpty(sortArr) === true) {
        return false;
      }

      const types = {
        '+': 'ASC',
        '-': 'DESC'
      };
      _.forEach(sortArr, (item) => {
        const sortFieldArr = item[0].split(' ');
        let type = types[item[0]];

        let field = _.trim(item.slice(1));
        if (_.isUndefined(type) === true) {
          field = _.trim(item);
        }

        if (sortFieldArr.length === 2 || _.isUndefined(type) === true) {
          type = 'ASC';
        }

        if (_.isEmpty(type) === false && item.length > 2) {
          // const field = _.trim(item.slice(1));
          const isValidField = _.isEmpty(validSortField) ? true : _.indexOf(validSortField, field) >= 0;
          if (isValidField === true) {
            const isExist = _.find(result, field);
            if (_.isEmpty(isExist) === true) {
              result.push([
                field, type
              ]);
            }
          }
        }
      });
      return result || false;
    } catch (error) {
      return result;
    }
  },

  HandleSortCustomSequelize: (sort, validSortField = [], customField = []) => {
    const result = [];
    try {
      if (_.isEmpty(sort) === true) {
        return result;
      }

      const sortArr = sort.split(',');
      if (_.isEmpty(sortArr) === true) {
        return false;
      }

      const types = {
        '+': 'ASC',
        '-': 'DESC'
      };

      _.forEach(sortArr, (item) => {
        const sortFieldArr = item[0].split(' ');
        let type = types[item[0]];

        let field = _.trim(item.slice(1));
        if (_.isUndefined(type) === true) {
          field = _.trim(item);
        }

        if (sortFieldArr.length === 2 || _.isUndefined(type) === true) {
          type = 'ASC';
        }

        if (_.isEmpty(type) === false && item.length > 0) {
          const isValidField = _.isEmpty(validSortField) ? true : _.indexOf(validSortField, field) >= 0;
          if (isValidField === true) {
            const isExist = _.find(result, field);
            if (_.isEmpty(isExist) === true) {
              const isJsonField = _.find(customField, { field });
              if (_.isEmpty(isJsonField) === false) {
                result.push([literal(isJsonField.value), type]);
              } else {
                result.push([
                  field, type
                ]);
              }
            }
          }
        }
      });
      return result || false;
    } catch (error) {
      return result;
    }
  },

  /**
     * Field section:
     * Input : 
     *      Request field : (String) field. Ex : title,fullname 
     *      Allow filter field : (Collection) mapFields (field,originalField). Ex :  ['id','fullname',{ field: 'owner', originalField: 'user_id' }]
     * OutPut : (Array) field. Ex : [ { field: 'id', type: 'number' } ]
     * */
  HandleFieldSelection: (fields, mapFields = []) => {
    if (_.isEmpty(fields) === true) {
      return false;
    }
    const result = [];
    const fieldArr = _.map(fields.split(','), _.trim);

    _.forEach(fieldArr, (field) => {
      const mapField = _.find(mapFields, { fieldName: field });
      if (_.isEmpty(mapField) === false) {
        result.push({
          fieldName: mapField.originalFieldName,
          type: mapField.originalFieldType
        });
      } else {
        result.push({
          fieldName: field,
          type: false
        });
      }
    });
    return result;
  },

  /**
     * Field section:
     * Input : 
     *      (Collection) filterFields. Ex : {fieldname: {type:"string"}}
     *      (Collection) filterFields (field,originalField). Ex :  [ { field: 'id', type: false },{ field: 'user_id', type: 'number' } ]
     * OutPut : (Array) field. Ex :[ { field: 'id', type: 'number' } ]
     * */

  HandleDatabaseFieldSelection: (dbFieldAttributes, filterFields = []) => {
    const result = [];
    if (_.isEmpty(dbFieldAttributes) === true) {
      return result;
    }

    _.forEach(dbFieldAttributes, (dbFieldAttribute, dbField) => {
      const checkFieldExist = _.find(filterFields, { fieldName: dbField });
      if (_.isEmpty(checkFieldExist) === false) {
        result.push({
          fieldName: dbField,
          type: checkFieldExist.type || dbFieldAttribute.type
        });
      }
    });
    return result;
  },

  HandleDatabaseFieldSelectionSequelize: (dbRawFieldAttributes, filterFields = []) => {
    const result = [];
    const mapKey = {
      INTEGER: 'number',
      STRING: 'string',
      DECIMAL: 'number',
      'DOUBLE PRECISION': 'number'
    };
    if (_.isEmpty(dbRawFieldAttributes) === true) {
      return result;
    }

    const dbFieldAttributes = _.map(dbRawFieldAttributes, (dbRawFieldAttribute, dbField) => {
      return {
        fieldName: dbField,
        type: mapKey[dbRawFieldAttribute.type.key]
      };
    });

    _.forEach(dbFieldAttributes, (dbFieldAttribute) => {
      const checkFieldExist = _.find(filterFields, { fieldName: dbFieldAttribute.fieldName });
      if (_.isEmpty(checkFieldExist) === false) {
        result.push({
          fieldName: dbFieldAttribute.fieldName,
          type: checkFieldExist.type || dbFieldAttribute.type
        });
      }
    });
    return result;
  },

  IsExistFile: async (uuid, filename, fileType) => {
    const S3 = require('./aws/S3');
    try {
      let subFolder = '';
      switch (fileType) {
        case 'auto_update':
          subFolder = AppConstant.AUTO_UPDATE_PATH;
          break;

        default:
          break;
      }
      const parseFolder = Utils.ParseFolder(uuid);
      const ext = path.extname(filename);
      const source = `${subFolder}/${parseFolder}/${uuid}/${uuid}${ext}`;
      const FileExist = await S3.FileExist(source);
      if (FileExist.code === 1) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  /**
     * Check diff between two object, using lodash
     * @param  {Object} object Object compared
     * @param  {Object} base   Object to compare with
     * @return {Array}        Return a new array with key diff
     */
  GetObjectDiff: (obj1, obj2) => {
    try {
      const result = {};
      const diff = Object.keys(obj1).reduce((data, key) => {
        // eslint-disable-next-line no-prototype-builtins
        if (!obj2.hasOwnProperty(key)) {
          data.push(key);
        } else if (_.isEqual(obj1[key], obj2[key])) {
          const resultKeyIndex = data.indexOf(key);
          data.splice(resultKeyIndex, 1);
        }
        return data;
      }, Object.keys(obj2));
      if (_.isEmpty(diff) === true) {
        return result;
      }
      _.forEach(diff, (item) => {
        result[item] = true;
      });
      return result;
    } catch (error) {
      return false;
    }
  },

  /**
     * Remove null,undefined value in object
     * @param  {Object} Source data
     * @param  {allows} Exception value. Ex: [''] or ['',null]
     * @return {Array}        Return a new array with key diff
     */
  CleanObject: (obj, allows = []) => {
    try {
      if (_.isEmpty(obj) === true) {
        return false;
      }

      const result = {};
      if (_.isEmpty(allows) === true) {
        _.forEach(obj, (item, key) => {
          if (_.isEmpty(item) === false || _.isNumber(item) === true) {
            result[key] = item;
          }
        });
        return result;
      }

      _.forEach(obj, (item, key) => {
        if (allows.indexOf(item) >= 0) {
          result[key] = item;
        } else if (_.isEmpty(item) === false || _.isNumber(item) === true) {
          result[key] = item;
        }
      });
      return result;
    } catch (error) {
      return false;
    }
  },

  DefaultSyncCondition: (conditions = {}, maps = [], additionAllows = []) => {
    try {
      if (_.isEmpty(conditions) === true) {
        return {};
      }
      const result = {};
      const defaultAllowSyncConditions = [
        'id_gte', 'id_gt', 'id_lte', 'id_lt',
        'last_modified_date_gte', 'last_modified_date_gt',
        'last_modified_date_lte', 'last_modified_date_lt'
      ];

      const allows = _.isArray(additionAllows) === true
        ? _.uniq(_.concat(defaultAllowSyncConditions, additionAllows))
        : defaultAllowSyncConditions;

      let filteredConditions = {};
      if (_.isEmpty(allows) === true) {
        filteredConditions = _.clone(conditions);
      } else {
        _.forEach(conditions, (item, key) => {
          if (allows.indexOf(key) >= 0) {
            filteredConditions[key] = item;
          }
        });
      }

      _.forEach(conditions, (item, key) => {
        switch (key) {
          case 'id_gte': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'id');
              result[conditionKey] = {
                [Op.gte]: item
              };
            }
            break;
          }

          case 'id_gt': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'id');
              result[conditionKey] = {
                [Op.gt]: item
              };
            }
            break;
          }

          case 'id_lte': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'id');
              result[conditionKey] = {
                [Op.lte]: item
              };
            }

            break;
          }

          case 'id_lt': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'id');
              result[conditionKey] = {
                [Op.lt]: item
              };
            }

            break;
          }

          case 'last_modified_date_gte': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'updated_date');
              result[conditionKey] = {
                [Op.gte]: item
              };
            }

            break;
          }

          case 'last_modified_date_gt': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'updated_date');
              result[conditionKey] = {
                [Op.gt]: item
              };
            }

            break;
          }

          case 'last_modified_date_lte': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'updated_date');
              result[conditionKey] = {
                [Op.lte]: item
              };
            }

            break;
          }

          case 'last_modified_date_lt': {
            if (_.isNumber(item) === true) {
              const conditionKey = Utils.DefaultSyncConditionMapKey(maps, 'updated_date');
              result[conditionKey] = {
                [Op.lt]: item
              };
            }

            break;
          }

          default:
            break;
        }
      });
      return result;
    } catch (error) {
      return {};
    }
  },

  RemoveDuplicateFailMessages: (data = []) => {
    if (_.isEmpty(data) === true) {
      return [];
    }

    const result = data.reduce((acc, current) => {
      const x = acc.find((item) => item.email === current.email);
      if (!x) {
        return acc.concat([current]);
      }
      return acc;
    }, []);
    return result;
  },

  ValidateEmailFormat: (email = []) => {
    try {
      if (_.isEmpty(email) === true) {
        return false;
      }

      // eslint-disable-next-line no-useless-escape
      // const REGEXP_EMAIL = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      // if (REGEXP_EMAIL.test(email) === false) {
      //   return false;
      // }

      // return true;
      return validator.isEmail(email);
    } catch (error) {
      return false;
    }
  },

  /**
     * Use this function for debug file
     * @param {*} filename 
     */
  GetFilesizeInBytes: (filename) => {
    if (_.isEmpty(filename) === true) {
      return 0;
    }
    const stats = Fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
  },

  JSONToCSV: (obj, header = true) => {
    return new Promise((resolve, reject) => {
      CSVStringify(obj, { header }, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  },

  JSONToCSVStream: (obj, header = true) => {
    return CSVStringify(obj, { header });
  },

  RolePermission: (userInfo, permission = [0, 1]) => {
    if (_.isEmpty(userInfo) === true) {
      return false;
    }
    if (_.indexOf(permission, userInfo.role) < 0) {
      return false;
    }
    return true;
  },
  BuildXoauth2Token: (emailAddress, accessToken) => {
    const authData = [
      `user=${emailAddress || ''}`,
      `auth=Bearer ${accessToken}`,
      '',
      ''
    ];
    return Buffer.from(authData.join('\x01'), 'utf-8').toString('base64');
  },
  FindPath: (opts) => {
    const { pathUpload, filename, fileUuid } = opts;
    if (_.isEmpty(pathUpload) === true || _.isEmpty(filename) === true || _.isEmpty(fileUuid) === true) {
      return false;
    }
    const ext = Path.extname(filename).toLowerCase().split('.').pop();
    const parseFolder = Utils.ParseFolder(fileUuid);
    return `${pathUpload}/${parseFolder}/${fileUuid}/${fileUuid}.${ext}`;
  },
  getAccessTokenOAuth2: (accessToken) => {
    let str = accessToken;
    str = str.trim(str);
    str = str.split(' ');
    return str[str.length - 1];
  },
  CachePatterns: (func, key, user = null) => {
    let mainKey = `${AppConstant.MAIN_KEY_CACHE}:${func}:${key}`;
    if (user !== null) {
      mainKey = `${AppConstant.MAIN_KEY_CACHE}:${user}:${func}:${key}`;
    }
    return mainKey;
  },

  generateAdminRevertDataCacheKey: (email) => {
    return `${APP_NAME}:admin_revert_user_data:${email}`;
  },

  generateAdminMigrateDataCacheKey: (email) => {
    return `${USER_MIGRATE_DATA_CACHE}${email}`;
  },

  generateFileUploadCacheKey: (uuid) => {
    return `${APP_NAME}:release_file:${uuid}`;
  },
  generateRandomDecimal: () => {
    const maxInt = 4294967295;
    const randomInt = randomBytes(4).readUInt32LE(0);
    return randomInt / maxInt;
  }
};
module.exports = Utils;