/* eslint-disable prefer-regex-literals */
const _ = require('lodash');
const { v4: uuidv4, v1: uuidv1 } = require('uuid');
const AsyncForEach = require('await-async-foreach');
const Useragent = require('express-useragent');
const { QueryTypes } = require('sequelize');
const Crypto = require('crypto');
const Utils = require('../utilities/Utils');
const WebAESAccessToken = require('../utilities/WebAESAccessToken');
const AppsConstant = require('../constants/AppsConstant');
const OAuth2Constant = require('../constants/OAuth2Constant');
const MessageConstant = require('../constants/MessageConstant');
const restrictedRules = require('../constants/RestrictConstant');
const CacheUtility = require('../utilities/Cache');
const InternalAccountService = require('./InternalAccountService');
const QueueService = require('./QueueService');
const Re2 = require('re2');

const {
  AccessTokenModel, UserModel,
  CalendarModel, CollectionModel,
  KanbanModel, SettingModel, TrackingAppModel,
  UserTrackingAppModel, PrincipalModel, UrlModel,
  AddressbookModel, VirtualAliasModel, AdminPromotionModel,
  SubscriptionModel, SubscriptionPurchaseModel, CalendarinstanceModel,
  ReportCachedMigratedPlatformModel,
  ReportCachedUsersModel, AdminServantManagerModel, GlobalSettingModel,
  CollectionSystemModel, QuotaModel, GroupModel, GroupUserModel
} = require('../models/Sequelize');
const Server = require('../app').server;

const AccountService = {
  GenerateAccessToken: async (lengthInByte = AppsConstant.ACCESS_TOKEN_LENGTH_IN_BYTE) => {
    const iv = Crypto.randomBytes(AppsConstant.IV_LENGTH_IN_BYTE);
    const token = Crypto.randomBytes(lengthInByte);
    const accessTokenBin = Buffer.concat([iv, token]);
    const accessTokenHex = accessTokenBin.toString('hex');
    const accessTokenEncrypted = WebAESAccessToken.aes256EncryptBuffer(accessTokenHex, AppsConstant.AES_KEY, iv.toString('hex'));
    const isCacheExist = await CacheUtility.GetOAuthCache(accessTokenHex);
    if (_.isEmpty(isCacheExist) === false) {
      return AccountService.GenerateAccessToken(lengthInByte);
    }
    return {
      iv,
      hex: accessTokenHex,
      encrypted: accessTokenEncrypted
    };
  },

  GenerateRefreshToken: async (lengthInByte = AppsConstant.REFRESH_TOKEN_LENGTH_IN_BYTE) => {
    const iv = Crypto.randomBytes(AppsConstant.IV_LENGTH_IN_BYTE);
    const token = Crypto.randomBytes(lengthInByte);
    const refreshTokenBin = Buffer.concat([iv, token]);
    const refreshTokenHex = refreshTokenBin.toString('hex');
    const refreshTokenEncrypted = WebAESAccessToken.aes256EncryptBuffer(refreshTokenHex, AppsConstant.AES_KEY, iv.toString('hex'));
    const isCacheExist = await CacheUtility.GetOAuthCache(refreshTokenHex);
    if (_.isEmpty(isCacheExist) === false) {
      return AccountService.GenerateRefreshToken(AppsConstant.REFRESH_TOKEN_LENGTH_IN_BYTE);
    }

    return {
      iv,
      hex: refreshTokenHex,
      encrypted: refreshTokenEncrypted
    };
  },

  TokenAESHandler: (token, type) => {
    try {
      if (type === 'accessToken' && token.length !== (AppsConstant.ACCESS_TOKEN_LENGTH + AppsConstant.IV_LENGTH)) {
        return false;
      }
      if (type === 'refreshToken' && token.length !== (AppsConstant.REFRESH_TOKEN_LENGTH + AppsConstant.IV_LENGTH)) {
        return false;
      }

      const tokenBin = Buffer.from(token, 'hex');
      const iv = Buffer.alloc(AppsConstant.IV_LENGTH_IN_BYTE);
      tokenBin.copy(iv, 0, 0, AppsConstant.IV_LENGTH_IN_BYTE);

      const tokenEncrypted = WebAESAccessToken.aes256EncryptBuffer(token, AppsConstant.AES_KEY, iv.toString('hex'));
      return {
        code: 1,
        iv,
        hex: token,
        encrypted: tokenEncrypted
      };
    } catch (error) {
      return false;
    }
  },

  HandleEmail: (email) => {
    let str = email;
    str = str.trim(str);
    str = str.toLowerCase();
    return str;
  },

  ValidateEmail: (email) => {
    // const allowLettersRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const allowLettersRegex = new Re2('^[^@ ]+@([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$');
    if (!allowLettersRegex.test(email)) {
      return false;
    }
    return true;
  },

  ValidatePassword: (password) => {
    const passwordLength = password.length;
    const passwordLengthAllow = [6, 32];
    if (passwordLength < passwordLengthAllow[0] || passwordLength > passwordLengthAllow[1]) {
      return {
        code: 0,
        message: MessageConstant.PASSWORDS_LENGTH_MUST_HAVE_A_MINIMUM_OF_6_AND_A_MAXIMUM_OF_32_CHARACTERS_RESPECTIVELY
      };
    }
    return {
      code: 1
    };
  },

  // Validate email 
  ValidateEmailFormat: (email) => {
    try {
      if (AccountService.ValidateEmail(email) === false) {
        return false;
      }

      const arrEmail = email.split('@');
      const username = arrEmail[0];
      const numberOfDotAllow = 1;

      const allowLettersRegex = new Re2('^[A-Za-z][A-Za-z\\d._]{2,31}$');

      if ((username.match(/\./g) || []).length > numberOfDotAllow) {
        return false;
      }

      const rules = ['._', '__', '_.'];
      if (username.includes(rules[0]) || username.includes(rules[1]) || username.includes(rules[2])) {
        return false;
      }

      if (!(allowLettersRegex.test(username) && username.match(new Re2(/.*[A-Za-z0-9]$/)))) {
        return false;
      }

      /**
        * Explain regex below
        * The username starts with a letter.
        * The username is between 3 and 32 characters long.
        * The username can contain letters, digits, dots, and underscores.
        * The username ends with a letter or digit.
       */
      //const allowLettersRegex = /^(?=.*[A-Za-z0-9]$)[A-Za-z][A-Za-z\d._]{2,31}$/;
      // if (allowLettersRegex.test(username) === false) {
      //   return false;
      // }

      return true;
    } catch (error) {
      return false;
    }
  },

  CreateMigrateAccessToken: async (args, previousRefreshToken) => {
    const now = Utils.TimestampDouble();
    const expiredIn = (now + AppsConstant.ACCESS_TOKEN_EXPIRE_TIME) * 1000;
    const expiredRefreshToken = (now + AppsConstant.REFRESH_TOKEN_EXPIRE_TIME) * 1000;
    const accessToken = await AccountService.GenerateAccessToken();
    const refreshToken = await AccountService.GenerateRefreshToken();

    const insertAccessToken = {
      app_id: args.app_id,
      device_uid: args.device_uid,
      device_token: args.device_token || null,
      email: args.username,
      access_token: accessToken.encrypted,
      access_token_iv: accessToken.iv,
      refresh_token: refreshToken.encrypted,
      refresh_token_iv: refreshToken.iv,
      previous_refresh_token: previousRefreshToken ? Buffer.from(previousRefreshToken, 'hex') : null,
      token_type: AppsConstant.TOKEN_TYPE,
      expires_in: expiredIn,
      expires_in_refresh_token: expiredRefreshToken,
      user_agent: args.user_agent,
      ip: args.ip,
      is_revoked: 0,
      migrate_status: AppsConstant.USER_MIGRATE_STATUS.NOT_MIGRATE,
      created_date: Utils.TimestampDouble(),
      updated_date: Utils.TimestampDouble()
    };

    // Insert Tracking to DB
    await CacheUtility.SetOAuthCache(insertAccessToken, accessToken.hex);

    return {
      accessToken: accessToken.hex,
      refreshToken: refreshToken.hex,
      expiresIn: expiredIn
    };
  },

  CreateNewAccessToken: async (args, previousRefreshToken) => {
    const now = Utils.TimestampDouble();
    const expiredIn = (now + AppsConstant.ACCESS_TOKEN_EXPIRE_TIME) * 1000;
    const expiredRefreshToken = (now + AppsConstant.REFRESH_TOKEN_EXPIRE_TIME) * 1000;
    const tokens = await Promise.all([
      AccountService.GenerateAccessToken(),
      AccountService.GenerateRefreshToken()
    ]);

    const accessToken = tokens[0];
    const refreshToken = tokens[1];

    const insertAccessToken = {
      user_id: args.user_id,
      app_id: args.app_id,
      device_uid: args.device_uid,
      device_token: args.device_token || null,
      email: args.username,
      access_token: accessToken.encrypted,
      access_token_iv: accessToken.iv,
      refresh_token: refreshToken.encrypted,
      refresh_token_iv: refreshToken.iv,
      previous_refresh_token: previousRefreshToken ? Buffer.from(previousRefreshToken, 'hex') : null,
      token_type: AppsConstant.TOKEN_TYPE,
      expires_in: expiredIn,
      expires_in_refresh_token: expiredRefreshToken,
      user_agent: args.user_agent,
      ip: args.ip,
      is_revoked: 0,
      created_date: Utils.TimestampDouble(),
      updated_date: Utils.TimestampDouble()
    };
    // Insert AccessToken to DB
    const accessTokenInfo = await AccessTokenModel.create(insertAccessToken, {
      returning: true,
      raw: true
    });

    // Check Servant admin info
    const adminServant = await AdminServantManagerModel.findOne({
      attributes: ['id', 'role'],
      where: {
        email: args.username
      },
      useMaster: true,
      raw: true
    });

    // Insert Tracking to DB
    await Promise.all([
      AccountService.UserTrackingApp(args.user_agent, args.user_id, args.username, args.app_id),
      CacheUtility.SetOAuthCache({
        ...accessTokenInfo.dataValues, adminServant
      }, accessToken.hex)
    ]);

    await QueueService.AddUserToReportCachedQueue(args.username);
    return {
      accessToken: accessToken.hex,
      refreshToken: refreshToken.hex,
      expiresIn: expiredIn
    };
  },

  RefreshAccessToken: async (args, refreshToken) => {
    try {
      const now = Utils.TimestampDouble();
      const expiredIn = (now + AppsConstant.ACCESS_TOKEN_EXPIRE_TIME) * 1000;
      const expiredRefreshToken = (now + AppsConstant.REFRESH_TOKEN_EXPIRE_TIME) * 1000;
      const accessToken = await AccountService.GenerateAccessToken();
      const insertAccessToken = {
        user_id: args.user_id,
        app_id: args.app_id,
        device_uid: args.device_uid,
        device_token: args.device_token || null,
        email: args.username,
        access_token: accessToken.encrypted,
        access_token_iv: accessToken.iv,
        refresh_token: refreshToken.encrypted,
        refresh_token_iv: refreshToken.iv,
        token_type: AppsConstant.TOKEN_TYPE,
        expires_in: expiredIn,
        expires_in_refresh_token: expiredRefreshToken,
        user_agent: args.user_agent,
        ip: args.ip,
        is_revoked: 0,
        created_date: Utils.TimestampDouble(),
        updated_date: Utils.TimestampDouble()
      };
      // Insert AccessToken to DB
      const accessTokenInfo = await AccessTokenModel.create(insertAccessToken, {
        returning: true,
        raw: true
      });
      // Insert Tracking to DB
      await Promise.all([
        AccountService.UserTrackingApp(args.user_agent, args.user_id, args.username, args.app_id),
        CacheUtility.SetOAuthCache(accessTokenInfo.dataValues, accessToken.hex)
      ]);
      await QueueService.AddUserToReportCachedQueue(args.username);
      return {
        accessToken: accessToken.hex,
        refreshToken: refreshToken.hex,
        expiresIn: expiredIn
      };
    } catch (error) {
      return false;
    }
  },

  UserTrackingApp: async (userAgent, userId, username, appId) => {
    const agent = _.cloneDeep(userAgent);
    const buildNumber = agent.match(AppsConstant.BUILD_VERSION_MATCHER) ? agent.match(AppsConstant.BUILD_VERSION_MATCHER)[1] : '0';
    const floVersion = agent.match(AppsConstant.FLO_VERSION_MATCHER) ? agent.match(AppsConstant.FLO_VERSION_MATCHER)[1] : '0';
    const deviceModel = agent.match(AppsConstant.DEVICE_MODEL_MATCHER) ? agent.match(AppsConstant.DEVICE_MODEL_MATCHER)[1] : '';
    const appVersion = AccountService.AgentVersionHandler(agent);
    const agentName = AccountService.AgentNameHandler(agent, appVersion, deviceModel);

    let trackingAppVersion = await TrackingAppModel.findOne({
      where: {
        name: agentName,
        app_version: appVersion,
        build_number: buildNumber
      },
      useMaster: true,
      raw: true
    });

    if (_.isEmpty(trackingAppVersion) === true) {
      const insertAppVersionArgs = {
        name: agentName,
        app_version: appVersion,
        flo_version: floVersion,
        app_id: appId,
        build_number: buildNumber,
        updated_date: Utils.TimestampInteger(),
        created_date: Utils.TimestampInteger()
      };
      const newTrackingAppVersion = await TrackingAppModel.create(insertAppVersionArgs);

      trackingAppVersion = newTrackingAppVersion.get({
        plain: true
      });
      if (_.isEmpty(trackingAppVersion) === true) {
        return false;
      }
    }

    if (_.isEmpty(trackingAppVersion.app_id)) {
      await TrackingAppModel.update(
        {
          ...trackingAppVersion, app_id: appId
        },
        {
          where: {
            id: trackingAppVersion.id
          }
        }
      );
    }

    const userTracking = await UserTrackingAppModel.findOne({
      where: {
        user_id: userId,
        tracking_app_id: trackingAppVersion.id
      },
      useMaster: true,
      raw: true
    });
    if (_.isEmpty(userTracking) === true) {
      await UserTrackingAppModel.create({
        user_id: userId,
        username,
        tracking_app_id: trackingAppVersion.id,
        last_used_date: Utils.TimestampDouble(),
        updated_date: Utils.TimestampDouble(),
        created_date: Utils.TimestampDouble()
      });
    } else {
      await UserTrackingAppModel.update({
        username,
        last_used_date: Utils.TimestampDouble(),
        updated_date: Utils.TimestampDouble()
      }, {
        where: {
          id: userTracking.id
        },
        silent: true
      });
    }
    // update last used date after update user tracking app
    await ReportCachedUsersModel.update({
      last_used_date: Utils.TimestampDouble()
    }, {
      where: {
        user_id: userId
      }
    });
    return true;
  },

  CreateReportCacheMigratePlatform: async (userInfo, appId) => {
    try {
      const migratePlatform = {
        user_id: userInfo.id,
        app_reg_id: appId,
        created_date: Utils.TimestampDouble(),
        updated_date: Utils.TimestampDouble()
      };
      await ReportCachedMigratedPlatformModel.create(migratePlatform, {
        returning: false,
        raw: true
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  AgentVersionHandler: (agent) => {
    if (_.isEmpty(agent) === true) {
      return '';
    }
    const macVersion = agent.match(AppsConstant.MAC_VERSION_MATCHER)
      ? agent.match(AppsConstant.MAC_VERSION_MATCHER)[1] : false;

    if (_.isEmpty(macVersion) === false) {
      return macVersion;
    }
    const iosVersion = agent.match(AppsConstant.IOS_VERSION_MATCHER)
      ? agent.match(AppsConstant.IOS_VERSION_MATCHER)[1] : false;
    if (_.isEmpty(iosVersion) === false) {
      return iosVersion;
    }
    const browserVersion = agent.match(AppsConstant.BROWSER_VERSION_MATCHER)
      ? agent.match(AppsConstant.BROWSER_VERSION_MATCHER)[1] : false;
    return browserVersion || '';
  },

  AgentNameHandler: (agent, appVersion, defaultName = false) => {
    if (!agent) {
      return MessageConstant.UNKNOWN_DEVICE;
    }
    const agentParse = Useragent.parse(agent);
    const agentName = _.get(agentParse, 'platform', false);
    let name = _.isEmpty(defaultName) === false ? defaultName : agentName;

    if (agentName.toLowerCase() === 'unknown' && appVersion !== '') {
      name = `Mac ${appVersion}`;
    }
    if (agentName.toLowerCase() === 'linux') {
      name = _.get(agentParse, 'browser', false);
    }
    return _.isEmpty(name) === false ? name.trim() : MessageConstant.UNKNOWN_DEVICE;
  },

  CreateUser: async (userArgs, opts) => {
    try {
      const t = await UserModel.sequelize.transaction();
      const query = `INSERT INTO user(
                        username,
                        digesta1,
                        domain_id,
                        email,
                        password,
                        created_date,
                        updated_date,
                        appreg_id,
                        fullname,
                        rsa,
                        token,
                        token_expire,
                        birthday,
                        secondary_email,
                        description
                    ) VALUES (
                        $username, 
                        $digesta1, 
                        $domain_id, 
                        $email, 
                        ENCRYPT($password, CONCAT($hashPassPrefix, SUBSTRING(SHA(RAND()), $saltLength))),
                        $created_date, 
                        $updated_date,
                        $appreg_id,
                        $fullname, 
                        $rsa, 
                        $token, 
                        $token_expire, 
                        $birthday, 
                        $secondary_email,
                        $description
                    )`;
      const userData = {
        username: userArgs.email,
        email: userArgs.email,
        domain_id: userArgs.domain_id,
        digesta1: userArgs.digesta1,
        password: userArgs.password,
        hashPassPrefix: '$6$',
        saltLength: AppsConstant.SALT_LENGTH,
        created_date: userArgs.created_date,
        updated_date: userArgs.updated_date,
        appreg_id: userArgs.appreg_id,
        fullname: userArgs.fullname,
        rsa: userArgs.rsa,
        token: userArgs.token,
        token_expire: userArgs.token_expire,
        birthday: userArgs.birthday,
        secondary_email: userArgs.secondary_email,
        description: userArgs.description
      };
      const createUser = await UserModel.sequelize.query(query, {
        type: QueryTypes.INSERT,
        raw: true,
        transaction: t,
        bind: userData
      });

      if (_.isEmpty(createUser) === true) {
        return {
          code: 0,
          message: MessageConstant.CREATE_USER_FAIL
        };
      }

      const usrPassword = await UserModel.findOne({
        attributes: ['password'],
        where: {
          id: createUser[0]
        },
        transaction: t,
        useMaster: true,
        raw: true
      });

      const user = {
        ...userData, id: createUser[0] ?? 0, ...usrPassword
      };
      // 0 >> floMailInternalSignUp
      // 1 >> createUserCalendar
      // 2 >> createUserPrincipal
      const defaultDatas = await Promise.all([
        InternalAccountService.FloMailInternalSignUp(user.username, user.password),
        AccountService.CreateUserCalendar(user, opts, t),
        AccountService.CreateUserPrincipal(user.email, t)
      ]);

      if (defaultDatas[0] === false || defaultDatas[0] === -1 || defaultDatas[1].code === 0 || defaultDatas[2].code === 0) {
        await t.rollback();
      }
      // floMailInternalSignUp
      if (defaultDatas[0] === -1) {
        return {
          code: -1,
          message: MessageConstant.USER_ALREADY_EXIST
        };
      }
      if (defaultDatas[0] === false) {
        return {
          code: 0,
          message: MessageConstant.CREATE_USER_FAIL
        };
      }

      // #generate user calendar
      if (defaultDatas[1].code === 0) {
        return {
          code: 0,
          message: defaultDatas[1].message
        };
      }

      // createUserPrincipal
      if (defaultDatas[2].code === 0) {
        return {
          code: 0,
          message: defaultDatas[2].message
        };
      }

      await t.commit();
      // Init default data
      setTimeout(async () => {
        await Promise.all([
          AccountService.GenerateUrlBookmarkData(user.id),
          AccountService.GenerateAddressbookData(user.email),
          AccountService.GenerateVirtualAlias(user.email, opts),
          AccountService.AutoUpgradePreYearly(user.id),
          AccountService.GenerateDefaultSystemCollection(user),
          AccountService.GenerateQuota(user.email)
        ]);
      }, 0);

      return {
        code: 1,
        user,
        message: MessageConstant.CREATE_USER_SUCCESS
      };
    } catch (err) {
      return {
        code: 0,
        message: MessageConstant.CREATE_USER_FAIL
      };
    }
  },

  CreateUserPrincipal: async (email, t) => {
    try {
      const principal = await PrincipalModel.findOne({
        where: {
          email
        },
        useMaster: true,
        raw: true
      });

      if (_.isEmpty(principal) === true) {
        await PrincipalModel.create({
          uri: `${OAuth2Constant.API_PRINCIPAL}${email}`,
          displayname: email,
          email
        }, {
          transaction: t
        });
      }
      return {
        code: 1
      };
    } catch (error) {
      return {
        code: 0,
        message: 'Generate principal false'
      };
    }
  },

  CreateUserCalendar: async ({ email, id: userId }, opts, t) => {
    try {
      const options = _.cloneDeep(opts);
      const cals = OAuth2Constant.ARR_CALS_DEFAULT;
      const principal = `${OAuth2Constant.API_PRINCIPAL}${email}`;
      const components = AppsConstant.COMPONENTS;
      const collectionArgs = [];
      const calendarArgs = [];
      const calendarInstanceArgs = [];
      let omniCalUri = '';
      _.forEach(cals, (cal, i) => {
        const uri = uuidv1();
        calendarArgs.push({
          synctoken: 1,
          components
        });

        calendarInstanceArgs.push({
          calendarid: '',
          principaluri: principal,
          displayname: cal.displayname,
          uri: uri.toString(),
          description: cal.description,
          calendarorder: '0',
          timezone: options.calendar_tz,
          calendarcolor: cal.calendarcolor
        });

        if (cal.displayname !== OAuth2Constant.DEF_OMNI_CALENDAR_NAME) {
          collectionArgs.push({
            user_id: userId,
            name: cal.displayname,
            color: cal.calendarcolor,
            calendar_uri: uri.toString(),
            type: cal.proj_type,
            alerts: null,
            order_storyboard: null,
            order_kanban: null,
            view_mode: 1,
            updated_date: Utils.TimestampDoublePlusIndex(i),
            created_date: Utils.TimestampDoublePlusIndex(i)
          });
        }

        if (cal.displayname === OAuth2Constant.DEF_OMNI_CALENDAR_NAME) {
          omniCalUri = uri.toString();
        }
      });

      const calendars = await CalendarModel.bulkCreate(calendarArgs, {
        transaction: t,
        raw: true,
        returning: true
      });

      if (_.isEmpty(calendars) === true || calendars.length !== calendarArgs.length) {
        return {
          code: 0,
          message: MessageConstant.GENERATE_CALENDARS_FAIL
        };
      }

      _.forEach(calendars, (calendar, key) => {
        calendarInstanceArgs[key].calendarid = calendar.id;
      });

      const calendarinstance = await CalendarinstanceModel.bulkCreate(calendarInstanceArgs, {
        transaction: t,
        raw: true,
        returning: true
      });

      if (_.isEmpty(calendarinstance) === true || calendarinstance.length !== calendarInstanceArgs.length) {
        return {
          code: 0,
          message: MessageConstant.GENERATE_CALENDARS_FAIL
        };
      }

      const collections = await CollectionModel.bulkCreate(collectionArgs, {
        transaction: t,
        raw: true,
        returning: true
      });

      if (_.isEmpty(collections) === true) {
        return {
          code: 0,
          message: MessageConstant.GENERATE_COLLECTIONS_FAIL
        };
      }

      let result = {
        code: 1
      };
      let systemKanbanArgs = [];
      const systemKanbanFunc = [];

      await AsyncForEach(collections, async (item, ci) => {
        const collection = item.get({
          plain: true
        });

        const calendarRaw = _.find(calendars, {
          uri: collection.calendar_id
        });

        options.cal_id = 0;
        if (_.isEmpty(calendarRaw) === false) {
          const calendar = calendarRaw.get({
            plain: true
          });
          options.cal_id = calendar.id;
        }

        if (collection.name === OAuth2Constant.DEF_CALENDAR_NAME) {
          options.omni_cal_uri = omniCalUri;
          options.cols = collection;
          systemKanbanFunc.push(AccountService.GenerateSettingDefault(userId, collection, options, t));
        }
        systemKanbanArgs = AccountService.GenerateSystemKanban(systemKanbanArgs, userId, collection, ci);
      });
      // 
      const defaultSettings = await Promise.all(systemKanbanFunc);
      defaultSettings.forEach((defaultSetting) => {
        if (defaultSetting.code === 0) {
          result = {
            code: 0,
            message: MessageConstant.GENERATE_DEFAULT_SETTING_FAIL
          };
        }
      });

      if (_.isEmpty(systemKanbanArgs) === false && result.code === 1) {
        const kanbans = await KanbanModel.bulkCreate(systemKanbanArgs, {
          transaction: t,
          raw: true,
          returning: true
        });
        if (_.isEmpty(kanbans) === true) {
          return {
            code: 0,
            message: MessageConstant.GENERATE_SYSTEM_KANBAN_FAIL
          };
        }
      }
      return result;
    } catch (error) {
      return {
        code: 0,
        message: MessageConstant.GENERATE_SYSTEM_KANBAN_FAIL
      };
    }
  },

  GenerateSettingDefault: async (userId, project, opts, t) => {
    const globalConfigItem = await GlobalSettingModel.findOne();
    try {
      const settingArgs = {
        user_id: userId,
        default_cal: project.calendar_id,
        timezone: _.get(opts, 'timezone', AppsConstant.TIMEZONE),
        event_duration: Number.isInteger(globalConfigItem?.event_duration) ? globalConfigItem.event_duration : 3600, // default is 1 hour
        alert_default: 1, // pop up alert
        alert_before: Number.isInteger(globalConfigItem?.alert_before) ? globalConfigItem.alert_before : 0, // Time of Start #600 #60 mins before
        default_alert_ade: Number.isInteger(globalConfigItem?.default_alert_ade) ? globalConfigItem.default_alert_ade : 0, // Date of Start
        snooze_default: Number.isInteger(globalConfigItem?.snooze_default) ? globalConfigItem.snooze_default : 900, // 15 mins
        timezone_support: 1, // true or false
        task_duration: Number.isInteger(globalConfigItem?.task_duration) ? globalConfigItem.task_duration : 1800, // mins = 30 mins = 1800 seconds
        deadline: -1, // None option
        due_task: Number.isInteger(globalConfigItem?.due_task) ? globalConfigItem.due_task : 0,

        number_stask: 5,
        total_duration: 21600,
        buffer_time: 900,
        hide_stask: 0,
        default_folder: project.id,
        calendar_color: OAuth2Constant.DEF_COLOR,
        folder_color: OAuth2Constant.DEF_COLOR,
        week_start: Number.isInteger(globalConfigItem?.week_start) ? globalConfigItem.week_start : 0,
        working_time: JSON.stringify(globalConfigItem?.working_time ? globalConfigItem.working_time : OAuth2Constant.WKHOURS), // json string
        m_show: 23, // month show
        dw_show: 23, // day week show
        agenda_show: 23, // agenda week show
        default_alert_todo: Number.isInteger(globalConfigItem?.default_alert_todo) ? globalConfigItem.default_alert_todo : 0, // date of due option
        mail_moving_check: 3, // check for bear track
        noti_bear_track: 3, // show notification for bear trackon alert box
        filing_email: false,
        contact_display_name: 1,
        contact_display_inlist: 0,
        omni_cal_id: opts.omni_cal_uri, // set omni calendar default
        // defaults
        navbar_system: '',
        navbar_custom: '',
        infobox: '',
        infobox_order: OAuth2Constant.INFOBOX_ORDER,
        emailbox_order: OAuth2Constant.EMAILBOX_ORDER,
        avatar: '',
        signature: '',
        updated_date: Utils.TimestampDouble(),
        created_date: Utils.TimestampDouble()

      };
      const createSetting = await SettingModel.create(settingArgs, {
        transaction: t
      });
      const setting = createSetting.get({
        plain: true
      });
      if (_.isEmpty(setting) === true) {
        return {
          code: 0,
          message: MessageConstant.GENERATE_DEFAULT_SETTING_FAIL
        };
      }

      return {
        code: 1
      };
    } catch (error) {
      return {
        code: 0,
        message: MessageConstant.GENERATE_DEFAULT_SETTING_FAIL
      };
    }
  },

  GenerateSystemKanban: (kanbans, userId, collection, collectionIndex) => {
    if (_.isEmpty(OAuth2Constant.SYSTEM_KANBANS) === true) {
      return kanbans;
    }
    _.forEach(OAuth2Constant.SYSTEM_KANBANS, (kanban, i) => {
      const orderNumber = i + 1;
      const dateTimeIndex = i + (collectionIndex * OAuth2Constant.SYSTEM_KANBANS.length);
      kanbans.push({
        user_id: userId,
        collection_id: collection.id,
        kanban_type: 1,
        name: kanban.name,
        color: kanban.color,
        sort_by_type: kanban.sort_by_type,
        order_kbitem: '',
        order_number: orderNumber,
        order_update_time: Utils.TimestampDoublePlusIndex(dateTimeIndex),
        updated_date: Utils.TimestampDoublePlusIndex(dateTimeIndex),
        created_date: Utils.TimestampDoublePlusIndex(dateTimeIndex)
      });
    });
    return kanbans;
  },

  GenerateUrlBookmarkData: (userId) => {
    try {
      if (_.isEmpty(OAuth2Constant.ARR_BOOKMARKS_URL) === true) {
        return {
          code: 1
        };
      }
      const urlArgs = [];
      _.forEach(OAuth2Constant.ARR_BOOKMARKS_URL, (item, i) => {
        const orderNumber = i + 1;
        const dateTime = Utils.TimestampDoublePlusIndex(i);
        urlArgs.push({
          user_id: userId,
          url: item.url,
          uid: uuidv4(),
          title: item.title,
          order_number: orderNumber,
          order_update_time: dateTime, // make diff time
          recent_date: dateTime,
          created_date: dateTime,
          updated_date: dateTime
        });
      });
      UrlModel.bulkCreate(urlArgs);
      return {
        code: 1
      };
    } catch (error) {
      return {
        code: 0,
        message: MessageConstant.SYSTEM_ERROR,
        error
      };
    }
  },

  GenerateAddressbookData: async (email) => {
    try {
      if (_.isEmpty(OAuth2Constant.API_PRINCIPAL) === true) {
        return {
          code: 1
        };
      }
      AddressbookModel.create({
        principaluri: `${OAuth2Constant.API_PRINCIPAL}${email}`,
        displayname: OAuth2Constant.DEF_CALENDAR_NAME,
        uri: email,
        description: OAuth2Constant.DEF_CALENDAR_NAME
      });
      return {
        code: 1
      };
    } catch (error) {
      return {
        code: 0,
        message: MessageConstant.SYSTEM_ERROR,
        error
      };
    }
  },

  GenerateVirtualAlias: async (email, opts) => {
    try {
      if (_.isEmpty(OAuth2Constant.VMAIL_PUSH_NOTI) === true) {
        return {
          code: 1
        };
      }
      VirtualAliasModel.create({
        domain_id: opts.domain_id,
        source: email,
        destination: `${email},${OAuth2Constant.VMAIL_PUSH_NOTI}`
      });
      return {
        code: 1
      };
    } catch (error) {
      return {
        code: 0,
        message: MessageConstant.SYSTEM_ERROR,
        error
      };
    }
  },

  AutoUpgradePreYearly: async (userId) => {
    try {
      // 
      const adminPromotion = await AdminPromotionModel.findOne({
        useMaster: true,
        raw: true
      });
      if (_.isEmpty(adminPromotion) === true || adminPromotion.allow_pre_signup !== 1) {
        return {
          code: 1
        };
      }

      const premiumSubscription = await SubscriptionModel.findOne({
        where: {
          order_number: 3
        },
        useMaster: true,
        raw: true
      });

      if (_.isEmpty(premiumSubscription) === true) {
        return {
          code: 1
        };
      }

      await SubscriptionPurchaseModel.create({
        user_id: userId,
        purchase_status: 1,
        sub_id: premiumSubscription.id,
        is_current: 1,
        receipt_data: '',
        created_date: Utils.TimestampDouble(),
        updated_date: Utils.TimestampDouble()
      });

      return {
        code: 1
      };
    } catch (error) {
      return {
        code: 0,
        message: MessageConstant.SYSTEM_ERROR,
        error
      };
    }
  },

  GenerateDefaultSystemCollection: async ({ id, email }) => {
    const collectionSystemUsers = await CollectionSystemModel.findAll({
      attributes: ['type'],
      where: {
        user_id: id,
        is_default: OAuth2Constant.DEFAULT_SYSTEM_COLLECTION_VALUE
      }
    });

    const data = [];
    OAuth2Constant.SYSTEM_COLLECTIONS.forEach((systemCollection, index) => {
      const saved = collectionSystemUsers.find(({ type }) => type === systemCollection.type);
      if (saved) {
        return;
      }
      const currentTimeDouble = (Date.now() + index) / 1000;
      data.push({
        user_id: id,
        email,
        ...systemCollection,
        is_default: OAuth2Constant.DEFAULT_SYSTEM_COLLECTION_VALUE,
        created_date: currentTimeDouble,
        updated_date: currentTimeDouble
      });
    });

    if (data.length > 0) {
      await CollectionSystemModel.bulkCreate(data, {
        raw: true,
        returning: true
      });
      return {
        code: 1
      };
    }
  },

  GenerateQuota: async (username) => {
    const query = 'INSERT INTO quota( username  ) VALUES ( $username  ) ';
    const createQuota = await QuotaModel.sequelize.query(query, {
      type: QueryTypes.INSERT,
      raw: true,
      bind: {
        username
      }
    });
    if (_.isEmpty(createQuota) === true) {
      return {
        code: 0,
        message: MessageConstant.CREATE_QUOTA_FAIL
      };
    }
    return {
      code: 1
    };
  },

  RestrictedUsername: async (username) => {
    // eslint-disable-next-line no-restricted-syntax      
    for (const restrictedRule of restrictedRules) {
      if (restrictedRule.type_matcher === 0 && username === restrictedRule.name) {
        return true;
      }

      if (restrictedRule.type_matcher === 1 && username.includes(restrictedRule.name)) {
        return true;
      }
    }
    return false;
  },

  RevokeToken: async (userId) => {
    try {
      // Destroy all cache
      const accessTokens = await AccessTokenModel.findAll({
        attributes: ['id', 'access_token_iv', 'access_token'],
        where: {
          user_id: userId
        },
        returning: true
      });

      const accessTokenIds = [];
      await AsyncForEach(accessTokens, async (accessToken) => {
        await CacheUtility.DestroyOAuthCache(accessToken.access_token, accessToken.access_token_iv);
        accessTokenIds.push(accessToken.id);
      });

      // Revoke all Access Token
      if (_.isEmpty(accessTokenIds) === false) {
        await AccessTokenModel.destroy({
          where: {
            id: accessTokenIds
          }
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  RevokeTokenByRefreshToken: async (accessTokenInfo) => {
    try {
      const accessTokens = await AccessTokenModel.findAll({
        attributes: ['id', 'access_token_iv', 'access_token'],
        where: {
          refresh_token: accessTokenInfo.refresh_token
        },
        raw: true
      });

      const accessTokenIds = [];
      await AsyncForEach(accessTokens, async (accessToken) => {
        await CacheUtility.DestroyOAuthCache(accessToken.access_token, accessToken.access_token_iv);
        accessTokenIds.push(accessToken.id);
      });

      // Revoke all current access token to disable them
      if (_.isEmpty(accessTokenIds) === false) {
        await AccessTokenModel.destroy({
          where: {
            id: accessTokenIds
          }
        });
        return true;
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  RevokeTokenByAccessToken: async (accessTokenInfo) => {
    try {
      const accessToken = await AccessTokenModel.findOne({
        attributes: ['id', 'access_token_iv', 'access_token'],
        where: {
          id: accessTokenInfo.id
        },
        raw: true
      });

      await CacheUtility.DestroyOAuthCache(accessToken.access_token, accessToken.access_token_iv);
      // Revoke current access token to disable them
      await AccessTokenModel.destroy({
        where: {
          id: accessToken.id
        },
        silent: true
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  RevokeTokenByDeviceUid: async (accessTokenInfo) => {
    try {
      const accessTokens = await AccessTokenModel.findAll({
        attributes: ['id', 'access_token_iv', 'access_token'],
        where: {
          user_id: accessTokenInfo.user_id,
          device_uid: accessTokenInfo.device_uid
        },
        returning: true
      });
      const accessTokenIds = [];
      await AsyncForEach(accessTokens, async (accessToken) => {
        await CacheUtility.DestroyOAuthCache(accessToken.access_token, accessToken.access_token_iv);
        accessTokenIds.push(accessToken.id);
      });

      // Revoke all current access token to disable them
      if (_.isEmpty(accessTokenIds) === false) {
        await AccessTokenModel.destroy({
          where: {
            id: accessTokenIds
          },
          silent: true
        });
        return true;
      }
      return true;
    } catch (error) {
      return false;
    }
  },

  UpdateQuota: async (username) => {
    const quotaData = await InternalAccountService.FloMailInternalGetByteFromQuota(username);
    if (quotaData > 0) {
      await QuotaModel.update({
        bytes: quotaData
      }, {
        where: {
          username
        }
      });
    }
    return true;
  },

  CheckAccountTestAndAddGroup: async (user, internalGroup) => {
    try {
      const groupConfig = InternalAccountService.GetTestGroupType(user.username, internalGroup);
      if (groupConfig?.internalGroup) {
        let groups = await GroupModel.findAll({
          attributes: ['id', 'group_type', 'name'],
          where: {
            group_type: AppsConstant.INTERNAL_GROUP,
            internal_group: groupConfig.internalGroup
          },
          raw: true
        });
        if (!groups || groups.length < 1) {
          const createGroup = await GroupModel.create({
            name: groupConfig.groupName,
            description: 'Test Group auto create',
            group_type: groupConfig.groupType,
            internal_group: groupConfig.internalGroup,
            created_date: Utils.TimestampDouble(),
            updated_date: Utils.TimestampDouble()
          }, {
            returning: true,
            raw: true
          });
          groups = [createGroup.dataValues];
        }
        await Promise.all(groups.map(async (g) => {
          const groupUser = {
            user_id: user.id,
            username: user.username,
            group_id: g.id,
            group_name: g.name,
            created_date: Utils.TimestampDouble(),
            updated_date: Utils.TimestampDouble()
          };
          return GroupUserModel.create(groupUser);
        }));
      }
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
    }
  }
};

module.exports = AccountService;
