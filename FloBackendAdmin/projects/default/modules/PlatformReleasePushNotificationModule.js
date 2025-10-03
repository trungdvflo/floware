/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-useless-catch */
const {
  Op
} = require('sequelize');
const _ = require('lodash');
const {
  ReleaseModel,
  PlatformReleasePushNotificationsModel
} = require('../models');

const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');
const SQS = require('../utilities/aws/SQS');

const Private = {
  ValidatePlatformReleasesRequest: (request, allowFilterKeys, allowSortFields) => {
    const { query } = request;
    const {
      filter_key,
      sort
    } = query;

    if (_.isEmpty(filter_key) === false && _.isEmpty(allowFilterKeys) === false) {
      const message = 'Invalid filter_key value, please check available filter_key';

      const filterArr = filter_key ? filter_key.split(',').map((item) => item.trim()) : [];
      const accountTypeUnion = _.union(filterArr, allowFilterKeys);

      if (accountTypeUnion.length !== allowFilterKeys.length) {
        return {
          code: 0,
          message
        };
      }
    }

    if (_.isEmpty(sort) === false && _.isEmpty(allowSortFields) === false) {
      let error = 0;
      const sortArr = sort.split(',');
      const types = {
        '+': 'ASC',
        '-': 'DESC'
      };
      _.forEach(sortArr, (item) => {
        const type = types[item[0]];
        let field = _.trim(item.slice(1));

        if (_.isUndefined(type) === true) {
          field = _.trim(item);
        }
        if (_.indexOf(allowSortFields, field) < 0) {
          error = 1;
        }
      });

      if (error === 1) {
        return {
          code: 0,
          message: 'Invalid sort field, please check available sort field'
        };
      }
    }
    return {};
  },
  FilterPlatformReleasePushNotification: (request) => {
    const {
      query
    } = request;
    const result = {};
    try {
      if (_.isEmpty(query.filter_key) === true || _.isEmpty(query.keyword) === true) {
        return {};
      }

      const filter = Utils.HandleFilterToAttr(query.keyword);
      const filterKeys = query.filter_key.split(',');

      result[Op.or] = [];
      _.forEach(filterKeys, (filterKey) => {
        switch (filterKey.trim()) {
          case 'id': {
            result[Op.or].push({
              id: {
                [Op.substring]: Number(filter.value)
              }
            });
            break;
          }
          case 'app_id': {
            result[Op.or].push({
              app_id: {
                [Op.substring]: filter.value.toString()
              }
            });

            break;
          }
          case 'base_release_id': {
            result[Op.or].push({
              base_release_id: {
                [Op.substring]: Number(filter.value)
              }
            });
            break;
          }
          case 'destination_release_id': {
            result[Op.or].push({
              destination_release_id: {
                [Op.substring]: Number(filter.value)
              }
            });
            break;
          }
          case 'force_update': {
            result[Op.or].push({
              force_update: {
                [Op.substring]: Number(filter.value)
              }
            });
            break;
          }
          case 'message': {
            result[Op.or].push({
              message: {
                [Op.substring]: filter.value.toString()
              }
            });
            break;
          }

          case 'title': {
            result[Op.or].push({
              title: {
                [Op.substring]: filter.value.toString()
              }
            });
            break;
          }
          default:
            break;
        }
      });

      return result;
    } catch (error) {
      return result;
    }
  }
};

const GetPlatformReleases = async (request, h) => {
  try {
    const {
      query
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const allowFilterKeys = [
      'id',
      'app_id',
      'base_release_id',
      'destination_release_id',
      'force_update',
      'title',
      'message'
    ];

    const allowSortFields = [
      'id',
      'app_id',
      'force_update',
      'base_release_id',
      'destination_release_id',
      'force_update',
      'title',
      'message'
    ];
    const attributes = [
      'id',
      'app_id',
      'base_release_id',
      'destination_release_id',
      'title',
      'message',
      'force_update',
      'created_date',
      'updated_date'
    ];

    const validation = Private.ValidatePlatformReleasesRequest(request, allowFilterKeys, allowSortFields);
    if (validation.code === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: [validation.message]
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const where = await Private.FilterPlatformReleasePushNotification(request);
    const order = Utils.HandleSortSequelize(query.sort, allowSortFields);
    const platformReleases = await PlatformReleasePushNotificationsModel.findAndCountAll({
      attributes,
      where,
      include: [{
        attributes: ['id', 'version', 'build_number'],
        model: ReleaseModel,
        as: 'basePlatformReleasePushNotifications',
        where: {
          release_status: '2'
        },
        required: true
      }, {

        attributes: ['id', 'version', 'build_number', 'url_download'],
        model: ReleaseModel,
        as: 'destinationPlatformReleasePushNotifications',
        where: {
          release_status: '2'
        },
        required: true
      }],
      order,
      offset: paging.offset,
      limit: paging.limit,
      raw: true
    });

    const data = _.get(platformReleases, 'rows', []);
    const totalRows = _.get(platformReleases, 'count', 0);

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: []
      }).code(Code.REQUEST_SUCCESS).header('X-Total-Count', totalRows);
    }
    const result = [];

    _.forEach(data, (item) => {
      const platformRelease = _.clone(item);
      const baseBuildNumber = platformRelease['basePlatformReleasePushNotifications.build_number'] ? Number(platformRelease['basePlatformReleasePushNotifications.build_number']) : '';
      const destinationBuildNumber = platformRelease['destinationPlatformReleasePushNotifications.build_number'] ? Number(platformRelease['destinationPlatformReleasePushNotifications.build_number']) : '';
      platformRelease.base_release = {
        release_id: platformRelease['basePlatformReleasePushNotifications.id'],
        version: platformRelease['basePlatformReleasePushNotifications.version'],
        build_number: baseBuildNumber
      };

      platformRelease.destination_release = {
        release_id: platformRelease['destinationPlatformReleasePushNotifications.id'],
        version: platformRelease['destinationPlatformReleasePushNotifications.version'],
        build_number: destinationBuildNumber,
        url_download: platformRelease['destinationPlatformReleasePushNotifications.url_download']
      };
      result.push(_.pick(platformRelease, [
        'id', 'app_id', 'base_release', 'destination_release', 'title', 'message', 'force_update', 'created_date', 'updated_date'
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

const GetPlatformRelease = async (request, h) => {
  try {
    // 
    const {
      params
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const attributes = [
      'id', 'app_id', 'title', 'message', 'force_update', 'created_date', 'updated_date'
    ];
    const data = await PlatformReleasePushNotificationsModel.findOne({
      attributes,
      where: {
        id: params.id,
        status: 1
      },
      include: [{
        attributes: ['id', 'version', 'build_number'],
        model: ReleaseModel,
        as: 'basePlatformReleasePushNotifications',
        where: {
          release_status: '2'
        },
        required: true
      }, {
        attributes: ['id', 'version', 'build_number', 'url_download'],
        model: ReleaseModel,
        as: 'destinationPlatformReleasePushNotifications',
        where: {
          release_status: '2'
        },
        required: true
      }],
      raw: true
    });

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Platform release doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const baseBuildNumber = data['basePlatformReleasePushNotifications.build_number'] ? Number(data['basePlatformReleasePushNotifications.build_number']) : '';
    const destinationBuildNumber = data['destinationPlatformReleasePushNotifications.build_number'] ? Number(data['destinationPlatformReleasePushNotifications.build_number']) : '';

    data.base_release = {
      release_id: data['basePlatformReleasePushNotifications.id'],
      version: data['basePlatformReleasePushNotifications.version'],
      build_number: baseBuildNumber
    };

    data.destination_release = {
      release_id: data['destinationPlatformReleasePushNotifications.id'],
      version: data['destinationPlatformReleasePushNotifications.version'],
      build_number: destinationBuildNumber,
      url_download: data['destinationPlatformReleasePushNotifications.url_download']
    };

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: _.pick(data, [
        'id', 'app_id', 'base_release',
        'destination_release', 'title', 'message',
        'force_update', 'created_date', 'updated_date'
      ])
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const CreatePlatformRelease = async (request, h) => {
  try {
    const {
      payload
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    if (payload.base_release_id === payload.destination_release_id) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Invalid release id']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const baseRelease = await ReleaseModel.findOne({
      attributes: [
        ['id', 'release_id'], 'version', 'build_number'
      ],
      where: {
        id: payload.base_release_id,
        app_id: payload.app_id,
        release_status: '2'
      },
      raw: true
    });

    if (_.isEmpty(baseRelease) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Base release doesn\'t exist or doesn\'t published (status = 2)']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const destinationRelease = await ReleaseModel.findOne({
      attributes: [
        ['id', 'release_id'], 'version', 'build_number', 'url_download'
      ],
      where: {
        id: payload.destination_release_id,
        app_id: payload.app_id,
        release_status: '2'
      },
      raw: true
    });

    if (_.isEmpty(destinationRelease) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Destination release doesn\'t exist or doesn\'t published (status = 2)']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    if (Number(baseRelease.build_number) >= Number(destinationRelease.build_number)) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Destination release build_number must be bigger than the base release build_number']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const releasePlatform = await PlatformReleasePushNotificationsModel.findOne({
      attributes: ['id'],
      where: {
        base_release_id: payload.base_release_id,
        destination_release_id: payload.destination_release_id
      },
      raw: true
    });

    if (_.isEmpty(releasePlatform) === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Release platform push notification already exist']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const currentTimestamp = Utils.Timestamp();
    const result = await PlatformReleasePushNotificationsModel.create({
      app_id: payload.app_id,
      base_release_id: payload.base_release_id,
      destination_release_id: payload.destination_release_id,
      title: payload.title,
      message: payload.message,
      force_update: payload.force_update,
      created_date: currentTimestamp,
      updated_date: currentTimestamp
    });

    if (_.isEmpty(result) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Create platform release push notification failed, please try again later!']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const rawData = result.toJSON();
    baseRelease.build_number = Number(baseRelease.build_number);
    destinationRelease.build_number = Number(destinationRelease.build_number);
    rawData.base_release = _.pick(baseRelease, ['release_id', 'version', 'build_number']);
    rawData.destination_release = _.pick(destinationRelease, ['release_id', 'version', 'build_number', 'url_download']);

    /**
         * Call SQS
         */
    await SQS.SendMessage({
      message: {
        app_id: payload.app_id,
        release_id: baseRelease.release_id,
        title: payload.title,
        message: payload.message,
        url_download: rawData.destination_release.url_download
      }
    }, process.env.END_OF_LIFE_PUSH_QUEUE);

    const data = _.pick(rawData, [
      'id', 'title', 'app_id', 'base_release',
      'destination_release', 'message', 'force_update',
      'created_date', 'updated_date'
    ]);

    return h.response({
      code: Code.CREATE_SUCCESS,
      data
    }).code(Code.CREATE_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const ModifyPlatformRelease = async (request, h) => {
  try {
    const {
      payload,
      params
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const releasePlatform = await PlatformReleasePushNotificationsModel.findOne({
      where: {
        id: params.id
      },
      include: [{
        attributes: ['id'],
        model: ReleaseModel,
        as: 'basePlatformReleasePushNotifications',
        where: {
          release_status: '2'
        },
        required: true
      }, {
        attributes: ['id'],
        model: ReleaseModel,
        as: 'destinationPlatformReleasePushNotifications',
        where: {
          release_status: '2'
        },
        required: true
      }],
      raw: true
    });

    if (_.isEmpty(releasePlatform) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release platform push notification doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const result = await PlatformReleasePushNotificationsModel.update({
      title: payload.title,
      message: payload.message,
      force_update: payload.force_update,
      updated_date: Utils.Timestamp()
    }, {
      where: {
        id: params.id
      }
    });

    if (_.isEmpty(result) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Modify platform release push notification failed, please try again later!']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const releaseVersions = await ReleaseModel.findAll({
      attributes: [
        ['id', 'release_id'], 'version', 'build_number', 'url_download'
      ],
      where: {
        id: [
          releasePlatform.base_release_id,
          releasePlatform.destination_release_id
        ]
      },
      raw: true
    });

    const data = await PlatformReleasePushNotificationsModel.findOne({
      attributes: ['id', 'app_id', 'title', 'message', 'force_update', 'created_date', 'updated_date'],
      where: {
        id: params.id
      },
      raw: true
    });

    const baseRelease = _.find(releaseVersions, {
      release_id: releasePlatform.base_release_id
    });
    const destinationRelease = _.find(releaseVersions, {
      release_id: releasePlatform.destination_release_id
    });
    baseRelease.build_number = Number(baseRelease.build_number);
    destinationRelease.build_number = Number(destinationRelease.build_number);
    data.base_release = _.pick(baseRelease, ['release_id', 'version', 'build_number']);
    data.destination_release = _.pick(destinationRelease, ['release_id', 'version', 'build_number', 'url_download']);

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const DeletePlatformRelease = async (request, h) => {
  try {
    const {
      params
    } = request;
    const platformRelease = await PlatformReleasePushNotificationsModel.findOne({
      where: {
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(platformRelease) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Platform release doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    /**
         * Delete relation table record
         * */

    const isDeleted = await PlatformReleasePushNotificationsModel.destroy({
      where: {
        id: params.id
      }
    });

    if (isDeleted === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Remove platform release fail, please try again later !']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetPlatformReleases,
  GetPlatformRelease,
  CreatePlatformRelease,
  ModifyPlatformRelease,
  DeletePlatformRelease
};
