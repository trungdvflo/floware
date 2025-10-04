/* eslint-disable no-undef */
// const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');
const AccountService = require('../../../projects/default/services/AccountService');
const InternalAccountService = require('../../../projects/default/services/InternalAccountService');
const CacheUtility = require('../../../projects/default/utilities/Cache');
const AppsConstant = require('../../../projects/default/constants/AppsConstant');
const OAuth2Constant = require('../../../projects/default/constants/OAuth2Constant');
const WebAESAccessToken = require('../../../projects/default/utilities/WebAESAccessToken');
const UserModel = require('../../../projects/default/models/Sequelize/UserModel');
const QuotaModel = require('../../../projects/default/models/Sequelize/QuotaModel');
const AccessTokenModel = require('../../../projects/default/models/Sequelize/AccessTokenModel');
const TrackingAppModel = require('../../../projects/default/models/Sequelize/TrackingAppModel');
const UserTrackingAppModel = require('../../../projects/default/models/Sequelize/UserTrackingAppModel');
const ReportCachedMigratedPlatformModel = require('../../../projects/default/models/Sequelize/ReportCachedMigratedPlatformModel');
const PrincipalModel = require('../../../projects/default/models/Sequelize/PrincipalModel');
const CalendarModel = require('../../../projects/default/models/Sequelize/CalendarModel');
const CalendarinstanceModel = require('../../../projects/default/models/Sequelize/CalendarinstanceModel');
const CollectionModel = require('../../../projects/default/models/Sequelize/CollectionModel');
const KanbanModel = require('../../../projects/default/models/Sequelize/KanbanModel');
const SettingModel = require('../../../projects/default/models/Sequelize/SettingModel');
const GlobalSettingModel = require('../../../projects/default/models/Sequelize/GlobalSettingModel');
const UrlModel = require('../../../projects/default/models/Sequelize/UrlModel');
const AddressbookModel = require('../../../projects/default/models/Sequelize/AddressbookModel');
const VirtualAliasModel = require('../../../projects/default/models/Sequelize/VirtualAliasModel');
const AdminPromotionModel = require('../../../projects/default/models/Sequelize/AdminPromotionModel');
const SubscriptionModel = require('../../../projects/default/models/Sequelize/SubscriptionModel');
const SubscriptionPurchaseModel = require('../../../projects/default/models/Sequelize/SubscriptionPurchaseModel');
const CollectionSystemUserGeneratedModel = require('../../../projects/default/models/Sequelize/CollectionSystemUserGeneratedModel');
const ReportCachedUsersModel = require('../../../projects/default/models/Sequelize/ReportCachedUsersModel');
const AdminServantManagerModel = require('../../../projects/default/models/Sequelize/AdminServantManagerModel');
const CollectionSystemModel = require('../../../projects/default/models/Sequelize/CollectionSystemModel');
const GroupModel = require('../../../projects/default/models/Sequelize/GroupModel');
const GroupUserModel = require('../../../projects/default/models/Sequelize/GroupUserModel');
const Server = require('../../../projects/default/app').server;
const Cache = require('../../../projects/default/caches/Cache');

const { expect } = chai;

const userArgs = {
  user_id: 1,
  id: 1,
  username: 'test@flomail.net',
  email: 'test@flomail.net',
  password: '123',
  digesta1: '123',
  domain_id: 1
};

const opts = {
  timezone: 'America/Chicago',
  domain_id: 1
};

describe('Account service Spec', () => {
  beforeEach(() => {

  });

  afterEach(() => {

  });

  describe('Generate AccessToken', () => {
    afterEach(async () => {
      WebAESAccessToken.aes256EncryptBuffer.restore(); // Unwraps the spy
      CacheUtility.GetOAuthCache.restore(); // Unwraps the spy
    });

    it('Should Generate AccessToken without cache ', async () => {
      const getOAuthCacheValue = [];
      const GenerateAccessTokenValue = Buffer.from('Some string', 'hex');

      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(CacheUtility, 'GetOAuthCache').callsFake(() => getOAuthCacheValue);

      const result = await AccountService.GenerateAccessToken(AppsConstant.ACCESS_TOKEN_LENGTH_IN_BYTE);
      expect(result.iv).to.be.instanceof(Buffer);
    });

    it('Should Generate AccessToken with cache', async () => {
      const GenerateAccessTokenValue = Buffer.from('Some string', 'hex');

      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateAccessTokenValue);
      const getOAuthCache = await sinon.stub(CacheUtility, 'GetOAuthCache');

      getOAuthCache.onFirstCall().returns({
        value: true
      });
      getOAuthCache.onSecondCall().returns([]);

      const result = await AccountService.GenerateAccessToken(AppsConstant.ACCESS_TOKEN_LENGTH_IN_BYTE);
      expect(result.iv).to.be.instanceof(Buffer);
    });
  });

  describe('Generate RefreshToken', () => {
    afterEach(async () => {
      WebAESAccessToken.aes256EncryptBuffer.restore(); // Unwraps the spy
      CacheUtility.GetOAuthCache.restore(); // Unwraps the spy
    });

    it('Should Generate RefreshToken', async () => {
      const getOAuthCacheValue = [];
      const GenerateRefreshTokenValue = Buffer.from('Some string', 'hex');
      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateRefreshTokenValue);
      await sinon.stub(CacheUtility, 'GetOAuthCache').callsFake(() => getOAuthCacheValue);
      const result = await AccountService.GenerateRefreshToken(AppsConstant.REFRESH_TOKEN_LENGTH_IN_BYTE);
      expect(result.iv).to.be.instanceof(Buffer);
    });

    it('Should Generate RefreshToken without cache', async () => {
      const GenerateAccessTokenValue = Buffer.from('Some string', 'hex');

      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateAccessTokenValue);
      const getOAuthCache = await sinon.stub(CacheUtility, 'GetOAuthCache');

      getOAuthCache.onFirstCall().returns({
        value: true
      });
      getOAuthCache.onSecondCall().returns([]);

      const result = await AccountService.GenerateRefreshToken(AppsConstant.ACCESS_TOKEN_LENGTH_IN_BYTE);
      expect(result.iv).to.be.instanceof(Buffer);
    });
  });

  describe('TokenAES Handler', () => {
    afterEach(async () => {
      WebAESAccessToken.aes256EncryptBuffer.restore(); // Unwraps the spy
    });

    it('Should return buffer token ', async () => {
      const token = 'f67c0221135f52f02838b3e66c67d9456f1becfa884f6045a38a715f287f4bb6f26d2e8e9a63359664820da634b6a937';
      const GenerateAccessTokenValue = Buffer.from('Some string', 'hex');
      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateAccessTokenValue);
      const result = await AccountService.TokenAESHandler(token);
      expect(result.iv).to.be.instanceof(Buffer);
    });

    it('Should return false for invalid accessToken length ', async () => {
      const token = 'f67c0221135f52f02838b3e66c67d9456f1becfa884';
      const type = 'accessToken';
      const GenerateAccessTokenValue = Buffer.from('Some string', 'hex');
      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateAccessTokenValue);
      const result = await AccountService.TokenAESHandler(token, type);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid refreshToken length ', async () => {
      const token = 'f67c0221135f52f02838b3e66c67d9456f1becfa884';
      const type = 'refreshToken';
      const GenerateAccessTokenValue = Buffer.from('Some string', 'hex');
      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').callsFake(() => GenerateAccessTokenValue);
      const result = await AccountService.TokenAESHandler(token, type);
      expect(result).to.be.equal(false);
    });

    it('Should throw error when handle TokenAES', async () => {
      const error = new Error('Data is invalid');
      await sinon.stub(WebAESAccessToken, 'aes256EncryptBuffer').throws(error);
      const result = await AccountService.TokenAESHandler();
      expect(result).to.be.equal(false);
    });
  });

  describe('Email Handler', () => {
    it('Should return trim email', async () => {
      const email = ' testing@flomail.net ';
      const result = await AccountService.HandleEmail(email);
      expect(result).to.be.equal(email.trim());
    });

    it('Should return true for valid email', async () => {
      const email = 'testing@flomail.net';
      const result = await AccountService.ValidateEmail(email);
      expect(result).to.be.equal(true);
    });

    it('Should return false for invalid email', async () => {
      const email = ' testing ';
      const result = await AccountService.ValidateEmail(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for empty email', async () => {
      const email = false;
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format', async () => {
      const email = 'testing';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format: multi dot', async () => {
      const email = 'test.ing.a@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format: multi lodash', async () => {
      const email = 'test__inga@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format: dot & lodash', async () => {
      const email = 'test._inga@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format: lodash & dot', async () => {
      const email = 'test_.inga@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format: username is too short', async () => {
      const email = 't@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return false for invalid email format: special character', async () => {
      const email = 'abc%^@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });

    it('Should return true for valid email format', async () => {
      const email = 'testing@flomail.net';
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(true);
    });

    it('Should return false error function', async () => {
      const email = 'testing@flomail.net';
      const error = new Error('Data is invalid');
      await sinon.stub(AccountService, 'ValidateEmail').throws(error);
      const result = await AccountService.ValidateEmailFormat(email);
      expect(result).to.be.equal(false);
    });
  });

  describe('Password Handler', () => {
    it('Should return true for valid password', async () => {
      const password = 'validpasswordlength';
      const result = await AccountService.ValidatePassword(password);
      expect(result.code).to.be.equal(1);
    });

    it('Should return false for invalid password', async () => {
      const password = 'aaa';
      const result = await AccountService.ValidatePassword(password);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('CreateMigrateAccessToken', () => {
    afterEach(async () => {
      AccountService.GenerateAccessToken.restore(); // Unwraps the spy
      AccountService.GenerateRefreshToken.restore(); // Unwraps the spy
      CacheUtility.SetOAuthCache.restore(); // Unwraps the spy
    });

    it('Should create migrate AccessToken', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex')
      };
      const GenerateRefreshTokenValue = {
        hex: Buffer.from('Some string', 'hex')
      };

      await sinon.stub(AccountService, 'GenerateAccessToken').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'GenerateRefreshToken').callsFake(() => GenerateRefreshTokenValue);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);
      const result = await AccountService.CreateMigrateAccessToken({
        username: 'abc@flomail.net'
      });

      expect(result.accessToken).to.be.instanceof(Buffer);
    });
  });

  describe('AddUserToReportCachedQueue', () => {
    afterEach(async () => {
    });
    beforeEach(async () => {
    });

    it('Should create AddUserToReportCachedQueue success', async () => {
      const result = await AccountService.AddUserToReportCachedQueue(userArgs.email);
      expect(result).to.be.not.null;
    });

  });

  describe('CreateNewAccessToken', () => {
    afterEach(async () => {
      AccountService.GenerateAccessToken.restore(); // Unwraps the spy
      AccountService.GenerateRefreshToken.restore(); // Unwraps the spy
      AccountService.UserTrackingApp.restore(); // Unwraps the spy
      CacheUtility.SetOAuthCache.restore(); // Unwraps the spy
      AccountService.AddUserToReportCachedQueue.restore();
    });

    it('Should create new AccessToken', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex')
      };
      const GenerateRefreshTokenValue = {
        hex: Buffer.from('Some string', 'hex')
      };

      await sinon.stub(AccountService, 'GenerateAccessToken').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'GenerateRefreshToken').callsFake(() => GenerateRefreshTokenValue);
      await sinon.stub(AccountService, 'UserTrackingApp').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);
      AdminServantManagerModel.findOne = () => { return true; };
      await sinon.stub(AdminServantManagerModel, 'findOne').callsFake(() => true);

      AccessTokenModel.create = () => {
        return true;
      };

      await sinon.stub(AccessTokenModel, 'create').callsFake(() => true);

      const result = await AccountService.CreateNewAccessToken({
        username: 'abc@flomail.net'
      });

      expect(result.accessToken).to.be.instanceof(Buffer);
    });
  });

  describe('RefreshAccessToken', () => {
    afterEach(async () => {
      AccountService.GenerateAccessToken.restore(); // Unwraps the spy
      AccountService.UserTrackingApp.restore(); // Unwraps the spy
      CacheUtility.SetOAuthCache.restore(); // Unwraps the spy
    });

    it('Should Refresh AccessToken', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      await sinon.stub(AccountService, 'GenerateAccessToken').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'UserTrackingApp').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);

      AccessTokenModel.create = () => {
        return true;
      };

      await sinon.stub(AccessTokenModel, 'create').callsFake(() => true);
      const result = await AccountService.RefreshAccessToken({
        username: 'abc@flomail.net'
      }, GenerateAccessTokenValue);

      expect(result.accessToken).to.be.instanceof(Buffer);
    });

    it('Should Refresh AccessToken fail: throw error', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      await sinon.stub(AccountService, 'GenerateAccessToken').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'UserTrackingApp').callsFake(() => true);

      const error = new Error('error');
      await sinon.stub(CacheUtility, 'SetOAuthCache').throws(error);

      const result = await AccountService.RefreshAccessToken({
        username: 'abc@flomail.net'
      }, GenerateAccessTokenValue);

      expect(result).to.be.equal(false);
    });
  });

  describe('UserTrackingApp', () => {
    afterEach(async () => {
      AccountService.AgentVersionHandler.restore(); // Unwraps the spy
      AccountService.AgentNameHandler.restore(); // Unwraps the spy
      CacheUtility.SetOAuthCache.restore(); // Unwraps the spy
    });

    it('Should create false: empty userAgent', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      const userAgent = false;
      const userId = 1;

      TrackingAppModel.get = () => { return true; };
      TrackingAppModel.create = () => { return true; };
      TrackingAppModel.findOne = () => { return true; };

      UserTrackingAppModel.findOne = () => { return true; };
      UserTrackingAppModel.create = () => { return true; };
      UserTrackingAppModel.update = () => { return true; };

      await sinon.stub(AccountService, 'AgentVersionHandler').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'AgentNameHandler').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);

      await sinon.stub(TrackingAppModel, 'findOne').callsFake(() => true);
      await sinon.stub(TrackingAppModel, 'create').callsFake(() => {
        return TrackingAppModel;
      });

      await sinon.stub(UserTrackingAppModel, 'findOne').callsFake(() => true);
      await sinon.stub(UserTrackingAppModel, 'create').callsFake(() => true);

      const result = await AccountService.UserTrackingApp(userAgent, userId);
      expect(result).to.be.equal(false);
    });

    it('Should create false: can not create TrackingApp', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36';
      const userId = 1;

      TrackingAppModel.get = () => { return true; };
      TrackingAppModel.create = () => { return true; };
      TrackingAppModel.findOne = () => { return true; };

      UserTrackingAppModel.findOne = () => { return true; };
      UserTrackingAppModel.create = () => { return true; };
      UserTrackingAppModel.update = () => { return true; };

      await sinon.stub(AccountService, 'AgentVersionHandler').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'AgentNameHandler').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);

      await sinon.stub(TrackingAppModel, 'findOne').callsFake(() => true);
      await sinon.stub(TrackingAppModel, 'create').callsFake(() => {
        return TrackingAppModel;
      });

      await sinon.stub(UserTrackingAppModel, 'findOne').callsFake(() => true);
      await sinon.stub(UserTrackingAppModel, 'create').callsFake(() => true);

      const result = await AccountService.UserTrackingApp(userAgent, userId);
      expect(result).to.be.equal(false);
    });

    it('Should create true: empty userTracking', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36';
      const userId = 1;

      TrackingAppModel.get = () => { return true; };
      TrackingAppModel.create = () => { return true; };
      TrackingAppModel.update = () => { return true; };
      TrackingAppModel.findOne = () => { return true; };

      UserTrackingAppModel.findOne = () => { return true; };
      UserTrackingAppModel.create = () => { return true; };
      UserTrackingAppModel.update = () => { return true; };
      ReportCachedUsersModel.update = () => { return true; };

      await sinon.stub(AccountService, 'AgentVersionHandler').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'AgentNameHandler').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);

      await sinon.stub(TrackingAppModel, 'findOne').callsFake(() => true);
      await sinon.stub(TrackingAppModel, 'create').callsFake(() => {
        return TrackingAppModel;
      });

      await sinon.stub(UserTrackingAppModel, 'findOne').callsFake([]);
      await sinon.stub(UserTrackingAppModel, 'create').callsFake(() => true);

      const result = await AccountService.UserTrackingApp(userAgent, userId);
      expect(result).to.be.equal(false);
    });

    it('Should create true: empty userTracking', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36';
      const userId = 1;

      TrackingAppModel.get = () => { return true; };
      TrackingAppModel.create = () => { return true; };
      TrackingAppModel.findOne = () => { return true; };

      UserTrackingAppModel.findOne = () => { return true; };
      UserTrackingAppModel.create = () => { return true; };
      UserTrackingAppModel.update = () => { return true; };

      await sinon.stub(AccountService, 'AgentVersionHandler').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'AgentNameHandler').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);

      await sinon.stub(TrackingAppModel, 'findOne').callsFake(() => {
        return {
          user_id: 1
        };
      });

      await sinon.stub(UserTrackingAppModel, 'findOne').callsFake(() => true);
      await sinon.stub(UserTrackingAppModel, 'create').callsFake(() => true);
      await sinon.stub(UserTrackingAppModel, 'update').callsFake(() => true);
      const result = await AccountService.UserTrackingApp(userAgent, userId);
      expect(result).to.be.equal(true);
    });

    it('Should create true', async () => {
      const GenerateAccessTokenValue = {
        hex: Buffer.from('Some string', 'hex'),
        encrypted: Buffer.from('Some string', 'hex')
      };
      const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36';
      const userId = 1;

      TrackingAppModel.get = () => { return true; };
      TrackingAppModel.create = () => { return true; };
      TrackingAppModel.findOne = () => { return true; };

      UserTrackingAppModel.findOne = () => { return true; };
      UserTrackingAppModel.create = () => { return true; };
      UserTrackingAppModel.update = () => { return true; };
      ReportCachedUsersModel.update = () => { return true; };

      await sinon.stub(AccountService, 'AgentVersionHandler').callsFake(() => GenerateAccessTokenValue);
      await sinon.stub(AccountService, 'AgentNameHandler').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetOAuthCache').callsFake(() => true);

      await sinon.stub(TrackingAppModel, 'findOne').callsFake(() => {
        return {
          user_id: 1
        };
      });

      await sinon.stub(UserTrackingAppModel, 'findOne').callsFake(() => {
        return {
          user_id: 1
        };
      });
      await sinon.stub(UserTrackingAppModel, 'create').callsFake(() => true);
      await sinon.stub(UserTrackingAppModel, 'update').callsFake(() => true);
      const result = await AccountService.UserTrackingApp(userAgent, userId);
      expect(result).to.be.equal(true);
    });
  });

  describe('CreateReportCacheMigratePlatform', () => {
    afterEach(async () => {
      CacheUtility.GetMigratedPlatform.restore(); // Unwraps the spy
      CacheUtility.SetMigratedPlatform.restore(); // Unwraps the spy
    });

    it('Should return true: empty cache', async () => {
      const args = {
        id: 1,
        username: 'test@flomail.net'
      };
      const appId = 'e70f1b125cbad944424393cf309efaf0'; // web

      ReportCachedMigratedPlatformModel.create = () => { return true; };

      await sinon.stub(CacheUtility, 'GetMigratedPlatform').callsFake(() => undefined);
      await sinon.stub(ReportCachedMigratedPlatformModel, 'create').callsFake(() => undefined);
      await sinon.stub(CacheUtility, 'SetMigratedPlatform').callsFake(() => undefined);
      const result = await AccountService.CreateReportCacheMigratePlatform(args, appId);
      expect(result).to.be.equal(true);
    });

    it('Should return true: empty cache', async () => {
      const args = {
        id: 1,
        username: 'test@flomail.net'
      };
      const appId = 'e70f1b125cbad944424393cf309efaf0'; // web

      ReportCachedMigratedPlatformModel.create = () => { return true; };

      await sinon.stub(CacheUtility, 'GetMigratedPlatform').callsFake(() => undefined);
      await sinon.stub(ReportCachedMigratedPlatformModel, 'create').callsFake(() => true);
      await sinon.stub(CacheUtility, 'SetMigratedPlatform').callsFake(() => true);
      const result = await AccountService.CreateReportCacheMigratePlatform(args, appId);
      expect(result).to.be.equal(true);
    });

    it('Should return false: throw error', async () => {
      const args = {
        id: 1,
        username: 'test@flomail.net'
      };
      const appId = 'e70f1b125cbad944424393cf309efaf0'; // web
      const error = new Error('Data is invalid');

      ReportCachedMigratedPlatformModel.create = () => { return true; };
      await sinon.stub(ReportCachedMigratedPlatformModel, 'create').throws(error);

      await sinon.stub(CacheUtility, 'GetMigratedPlatform').callsFake(() => undefined);
      await sinon.stub(CacheUtility, 'SetMigratedPlatform').callsFake(() => undefined);
      const result = await AccountService.CreateReportCacheMigratePlatform(args, appId);
      expect(result).to.be.equal(false);
    });
  });

  describe('AgentVersionHandler', () => {
    afterEach(async () => {
    });

    it('Should return web agent version', async () => {
      const userAgent = false;
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('');
    });

    it('Should return ios agent version', async () => {
      const userAgent = 'Flo/0.9.10 (iPhone; build 201805281139; iOS Version 11.3; Scale/2.00; Device iPhone 7s)';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('11.3');
    });

    it('Should return ipad agent version', async () => {
      const userAgent = 'Flo/0.9.10 (iPad; build 201805281139; iOS Version 11.3.1; Device iPad Pro 5.3) Alamofire/4.7.1';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('11.3.1');
    });
    it('Should return mac agent version', async () => {
      const userAgent = 'Flo/0.2.0 (Mac OS X; build 201805281139; Mac OS X Version 10.9.3; Device Macbook)';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('10.9.3');
    });
  });

  describe('AgentVersionHandler', () => {
    afterEach(async () => {
    });

    it('Should return empty string', async () => {
      const userAgent = false;
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('');
    });

    it('Should return browser agent version', async () => {
      const userAgent = 'Mozilla/5.0 (X11; Fedora;Linux x86; rv:60.0) Gecko/20100101 Firefox/60.0';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('5.0');
    });

    it('Should return ios agent version', async () => {
      const userAgent = 'Flo/0.9.10 (iPhone; build 201805281139; iOS Version 11.3; Scale/2.00; Device iPhone 7s)';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('11.3');
    });

    it('Should return ipad agent version', async () => {
      const userAgent = 'Flo/0.9.10 (iPad; build 201805281139; iOS Version 11.3.1; Device iPad Pro 5.3) Alamofire/4.7.1';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('11.3.1');
    });
    it('Should return mac agent version', async () => {
      const userAgent = 'Flo/0.2.0 (Mac OS X; build 201805281139; Mac OS X Version 10.9.3; Device Macbook)';
      const result = await AccountService.AgentVersionHandler(userAgent);
      expect(result).to.be.equal('10.9.3');
    });
  });

  describe('AgentNameHandler', () => {
    afterEach(async () => {
    });

    it('Should return agent version', async () => {
      const userAgent = '';
      const result = await AccountService.AgentNameHandler(userAgent);
      expect(result).to.be.equal('Mac undefined');
    });

    it('Should return ios agent version', async () => {
      const userAgent = 'Flo/0.9.10 (iPhone; build 201805281139; iOS Version 11.3; Scale/2.00; Device iPhone 7s)';
      const result = await AccountService.AgentNameHandler(userAgent, '11.3');
      expect(result).to.be.equal('iPhone');
    });

    it('Should return ipad agent version', async () => {
      const userAgent = 'Flo/0.9.10 (iPad; build 201805281139; iOS Version 11.3.1; Device iPad Pro 5.3) Alamofire/4.7.1';
      const result = await AccountService.AgentNameHandler(userAgent, '11.3.1');
      expect(result).to.be.equal('iPad');
    });

    it('Should return mac agent version', async () => {
      const userAgent = 'Flo/0.2.0 (Mac OS X; build 201805281139; Mac OS X Version 10.9.3; Device Macbook)';
      const result = await AccountService.AgentNameHandler(userAgent, '10.9.3');
      expect(result).to.be.equal('Mac 10.9.3');
    });

    it('Should return linux agent version', async () => {
      const userAgent = 'Mozilla/5.0 (X11; Fedora;Linux x86; rv:60.0) Gecko/20100101 Firefox/60.0';
      const result = await AccountService.AgentNameHandler(userAgent, '10.9.3');
      expect(result).to.be.equal('Firefox');
    });
  });

  describe('CreateUser', () => {
    afterEach(async () => {
      InternalAccountService.FloMailInternalSignUp.restore();
      AccountService.CreateUserCalendar.restore();
      AccountService.CreateUserPrincipal.restore();
    });

    it('Should create user false', async () => {
      UserModel.transaction = () => { return true; };
      UserModel.sequelize = {
        transaction: () => { return true; },
        query: () => { return true; }
      };

      await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => true);
      await sinon.stub(InternalAccountService, 'FloMailInternalSignUp').callsFake(() => true);
      await sinon.stub(AccountService, 'CreateUserCalendar').callsFake(() => true);
      await sinon.stub(AccountService, 'CreateUserPrincipal').callsFake(() => true);
      const result = await AccountService.CreateUser(userArgs, opts);
      expect(result.code).to.be.equal(0);
    });

    it('Should create user false: throw error', async () => {
      UserModel.transaction = () => { return true; };
      UserModel.sequelize = {
        transaction: () => { return true; },
        query: () => { return true; }
      };

      const error = new Error('Data is invalid');
      await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => true);
      await sinon.stub(InternalAccountService, 'FloMailInternalSignUp').throws(error);
      await sinon.stub(AccountService, 'CreateUserCalendar').callsFake(() => true);
      await sinon.stub(AccountService, 'CreateUserPrincipal').callsFake(() => true);
      const result = await AccountService.CreateUser(userArgs, opts);
      expect(result.code).to.be.equal(0);
    });

    it('Should create user false: FloMailInternalSignUp false ', async () => {
      UserModel.findOne = () => { return true; };
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        },
        query: () => { return true; }

      };

      await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });
      await sinon.stub(UserModel.sequelize, 'query').callsFake(() => userArgs);
      await sinon.stub(UserModel, 'findOne').callsFake(() => userArgs);
      await sinon.stub(InternalAccountService, 'FloMailInternalSignUp').callsFake(() => false);
      await sinon.stub(AccountService, 'CreateUserCalendar').callsFake(() => {
        return {
          code: 1
        };
      });
      await sinon.stub(AccountService, 'CreateUserPrincipal').callsFake(() => {
        return {
          code: 1
        };
      });
      const result = await AccountService.CreateUser(userArgs, opts);
      expect(result.code).to.be.equal(0);
    });

    it('Should create user false: CreateUserCalendar false ', async () => {
      UserModel.findOne = () => { return true; };
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        },
        query: () => { return true; }

      };

      await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });
      await sinon.stub(UserModel.sequelize, 'query').callsFake(() => userArgs);
      await sinon.stub(UserModel, 'findOne').callsFake(() => userArgs);
      await sinon.stub(InternalAccountService, 'FloMailInternalSignUp').callsFake(() => true);
      await sinon.stub(AccountService, 'CreateUserCalendar').callsFake(() => {
        return {
          code: 0
        };
      });
      await sinon.stub(AccountService, 'CreateUserPrincipal').callsFake(() => {
        return {
          code: 1
        };
      });
      const result = await AccountService.CreateUser(userArgs, opts);
      expect(result.code).to.be.equal(0);
    });

    it('Should create user false: CreateUserPrincipal false ', async () => {
      UserModel.findOne = () => { return true; };
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        },
        query: () => { return true; }

      };

      await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });
      await sinon.stub(UserModel.sequelize, 'query').callsFake(() => userArgs);
      await sinon.stub(UserModel, 'findOne').callsFake(() => userArgs);
      await sinon.stub(InternalAccountService, 'FloMailInternalSignUp').callsFake(() => true);
      await sinon.stub(AccountService, 'CreateUserPrincipal').callsFake(() => {
        return {
          code: 0
        };
      });
      await sinon.stub(AccountService, 'CreateUserCalendar').callsFake(() => {
        return {
          code: 1
        };
      });
      const result = await AccountService.CreateUser(userArgs, opts);

      expect(result.code).to.be.equal(0);
    });

    it('Should create user', async () => {
      CollectionSystemModel.findAll = () => [
        {
          name: 'Email',
          type: 1
        }, {
          name: 'Calendar',
          type: 2
        }, {
          name: 'Organizer',
          type: 8
        }
      ];

      CollectionSystemModel.bulkCreate = () => { return true; };
      UserModel.findOne = () => { return true; };
      CollectionSystemUserGeneratedModel.create = () => { return true; };
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        },
        query: () => { return true; }
      };

      await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });

      await sinon.stub(UserModel.sequelize, 'query').callsFake(() => userArgs);
      await sinon.stub(UserModel, 'findOne').callsFake(() => userArgs);
      await sinon.stub(InternalAccountService, 'FloMailInternalSignUp').callsFake(() => true);
      await sinon.stub(AccountService, 'CreateUserCalendar').callsFake(() => {
        return {
          code: 1
        };
      });
      await sinon.stub(AccountService, 'CreateUserPrincipal').callsFake(() => {
        return {
          code: 1
        };
      });
      const result = await AccountService.CreateUser(userArgs, opts);
      expect(result.code).to.be.equal(1);
    });
  });

  describe('CreateUserPrincipal', () => {
    afterEach(async () => {
    });

    it('Should create user Principal success', async () => {
      PrincipalModel.create = () => { return true; };
      PrincipalModel.findOne = () => { return true; };

      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        }
      };

      const t = await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });
      const result = await AccountService.CreateUserPrincipal(userArgs, t);
      expect(result.code).to.be.equal(1);
    });

    it('Should create user Principal false', async () => {
      PrincipalModel.create = () => { return true; };
      PrincipalModel.findOne = () => { return true; };

      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        }
      };

      const t = await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });

      const error = new Error('Data is invalid');
      await sinon.stub(PrincipalModel, 'findOne').throws(error);

      const result = await AccountService.CreateUserPrincipal(userArgs, t);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('CreateUserCalendar', () => {
    afterEach(async () => {
      AccountService.GenerateSettingDefault.restore();
      AccountService.GenerateSystemKanban.restore();
    });

    it('Should create Calendar success', async () => {
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        }
      };

      CalendarModel.bulkCreate = () => {
        return OAuth2Constant.ARR_CALS_DEFAULT.map((item, i) => {
          return {
            calendar_id: i,
            uri: i,
            ...item,
            get: () => {
              return {
                calendar_id: i,
                uri: i,
                ...item
              };
            }
          };
        });
      };
      CalendarinstanceModel.bulkCreate = () => {
        return OAuth2Constant.ARR_CALS_DEFAULT;
      };
      KanbanModel.bulkCreate = () => {
        return OAuth2Constant.SYSTEM_KANBANS;
      };

      CollectionModel.bulkCreate = () => {
        return [{
          get: () => {
            return {
              user_id: 1,
              calendar_id: 1,
              name: 'General',
              color: 'calendarcolor',
              calendar_uri: '',
              type: 'proj_type',
              alerts: null,
              order_storyboard: null,
              order_kanban: null,
              view_mode: 1
            };
          }
        }];
      };

      const t = await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });

      await sinon.stub(AccountService, 'GenerateSettingDefault').callsFake(() => {
        return {
          code: 1
        };
      });
      await sinon.stub(AccountService, 'GenerateSystemKanban').callsFake(() => {
        return {
          user_id: 1
        };
      });
      const result = await AccountService.CreateUserCalendar(userArgs, opts, t);
      expect(result.code).to.be.equal(1);
    });

    it('Should create Calendar false: generate GenerateSettingDefault false', async () => {
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        }
      };

      CalendarModel.bulkCreate = () => {
        return OAuth2Constant.ARR_CALS_DEFAULT;
      };
      CalendarinstanceModel.bulkCreate = () => {
        return OAuth2Constant.ARR_CALS_DEFAULT;
      };
      KanbanModel.bulkCreate = () => {
        return OAuth2Constant.SYSTEM_KANBANS;
      };

      CollectionModel.bulkCreate = () => {
        return [{
          get: () => {
            return {
              user_id: 1,
              calendar_id: 1,
              name: 'General',
              color: 'calendarcolor',
              calendar_uri: '',
              type: 'proj_type',
              alerts: null,
              order_storyboard: null,
              order_kanban: null,
              view_mode: 1
            };
          }
        }];
      };

      const t = await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });

      await sinon.stub(AccountService, 'GenerateSettingDefault').callsFake(() => {
        return {
          code: 0
        };
      });
      await sinon.stub(AccountService, 'GenerateSystemKanban').callsFake(() => {
        return {
          user_id: 1
        };
      });
      const result = await AccountService.CreateUserCalendar(userArgs, opts, t);
      expect(result.code).to.be.equal(0);
    });

    it('Should create Calendar false: generate GenerateSystemKanban false', async () => {
      UserModel.sequelize = {
        transaction: () => {
          return {
            rollback: () => { return true; },
            commit: () => { return true; }
          };
        }
      };

      CalendarModel.bulkCreate = () => {
        return OAuth2Constant.ARR_CALS_DEFAULT;
      };
      CalendarinstanceModel.bulkCreate = () => {
        return OAuth2Constant.ARR_CALS_DEFAULT;
      };
      KanbanModel.bulkCreate = () => {
        return OAuth2Constant.SYSTEM_KANBANS;
      };

      CollectionModel.bulkCreate = () => {
        return [{
          get: () => {
            return {
              user_id: 1,
              calendar_id: 1,
              name: 'General',
              color: 'calendarcolor',
              calendar_uri: '',
              type: 'proj_type',
              alerts: null,
              order_storyboard: null,
              order_kanban: null,
              view_mode: 1
            };
          }
        }];
      };

      const t = await sinon.stub(UserModel.sequelize, 'transaction').callsFake(() => {
        return {
          rollback: () => { return true; },
          commit: () => { return true; }
        };
      });

      await sinon.stub(AccountService, 'GenerateSettingDefault').callsFake(() => {
        return {
          code: 1
        };
      });
      await sinon.stub(AccountService, 'GenerateSystemKanban').callsFake(() => {
        return {
          user_id: 0
        };
      });
      const result = await AccountService.CreateUserCalendar(userArgs, opts, t);
      expect(result.code).to.be.equal(1);
    });
  });

  describe('GenerateSettingDefault', () => {
    afterEach(async () => {
    });

    it('Should create SettingDefault success', async () => {
      const collection = {
        user_id: 1,
        calendar_id: 1,
        name: 'General',
        color: 'calendarcolor',
        calendar_uri: '',
        type: 'proj_type',
        alerts: null,
        order_storyboard: null,
        order_kanban: null,
        view_mode: 1
      };

      SettingModel.create = () => {
        return {
          get: () => {
            return {
              user_id: 1
            };
          }
        };
      };

      GlobalSettingModel.findOne = () => {
        return {
          id: 1
        };
      };

      const t = '';
      const result = await AccountService.GenerateSettingDefault(userArgs, collection, opts, t);
      expect(result.code).to.be.equal(1);
    });

    it('Should create SettingDefault false', async () => {
      const collection = {
        user_id: 1,
        calendar_id: 1,
        name: 'General',
        color: 'calendarcolor',
        calendar_uri: '',
        type: 'proj_type',
        alerts: null,
        order_storyboard: null,
        order_kanban: null,
        view_mode: 1
      };

      SettingModel.create = () => {
        return {
          get: () => {
            return false;
          }
        };
      };

      GlobalSettingModel.findOne = () => {
        return {
          id: 1
        };
      };

      const t = '';
      const result = await AccountService.GenerateSettingDefault(userArgs, collection, opts, t);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('GenerateSystemKanban', () => {
    afterEach(async () => {
    });

    it('Should generate SystemKanban success', async () => {
      const collection = {
        user_id: 1,
        calendar_id: 1,
        name: 'General',
        color: 'calendarcolor',
        calendar_uri: '',
        type: 'proj_type',
        alerts: null,
        order_storyboard: null,
        order_kanban: null,
        view_mode: 1
      };

      const result = await AccountService.GenerateSystemKanban([], userArgs, collection, 1);
      expect(result.length).to.be.equal(OAuth2Constant.SYSTEM_KANBANS.length);
    });
  });

  describe('GenerateUrlBookmarkData', () => {
    afterEach(async () => {
    });

    it('Should create UrlBookmarkData success', async () => {
      UrlModel.bulkCreate = () => {
        return OAuth2Constant.ARR_BOOKMARKS_URL;
      };

      const result = await AccountService.GenerateUrlBookmarkData(userArgs);
      expect(result.code).to.be.equal(1);
    });

    it('Should create UrlBookmarkData false: throw error', async () => {
      UrlModel.bulkCreate = () => {
        return false;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(UrlModel, 'bulkCreate').throws(error);

      const result = await AccountService.GenerateUrlBookmarkData(userArgs);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('GenerateAddressbookData', () => {
    afterEach(async () => {
    });

    it('Should create AddressbookData success', async () => {
      AddressbookModel.create = () => {
        return OAuth2Constant.ARR_BOOKMARKS_URL;
      };

      const result = await AccountService.GenerateAddressbookData(userArgs);
      expect(result.code).to.be.equal(1);
    });

    it('Should create UrlBookmarkData false: throw error', async () => {
      AddressbookModel.create = () => {
        return false;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(AddressbookModel, 'create').throws(error);

      const result = await AccountService.GenerateAddressbookData(userArgs);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('GenerateVirtualAlias', () => {
    afterEach(async () => {
    });

    it('Should create VirtualAlias success', async () => {
      VirtualAliasModel.create = () => {
        return {
          user_id: 1
        };
      };

      const result = await AccountService.GenerateVirtualAlias(userArgs, opts);
      expect(result.code).to.be.equal(1);
    });

    it('Should create VirtualAlias false: throw error', async () => {
      VirtualAliasModel.create = () => {
        return false;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(VirtualAliasModel, 'create').throws(error);

      const result = await AccountService.GenerateVirtualAlias(userArgs, opts);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('AutoUpgradePreYearly', () => {
    afterEach(async () => {
    });

    it('Should create AutoUpgradePreYearly success', async () => {
      AdminPromotionModel.findOne = () => {
        return {
          allow_pre_signup: 1
        };
      };

      SubscriptionModel.findOne = () => {
        return {
          id: 1
        };
      };

      SubscriptionPurchaseModel.create = () => {
        return true;
      };

      const result = await AccountService.AutoUpgradePreYearly(userArgs, opts);
      expect(result.code).to.be.equal(1);
    });

    it('Should create AutoUpgradePreYearly success: empty AdminPromotion ', async () => {
      AdminPromotionModel.findOne = () => {
        return false;
      };

      const result = await AccountService.AutoUpgradePreYearly(userArgs, opts);
      expect(result.code).to.be.equal(1);
    });

    it('Should create AutoUpgradePreYearly success: empty Subscription', async () => {
      AdminPromotionModel.findOne = () => {
        return {
          allow_pre_signup: 1
        };
      };

      SubscriptionModel.findOne = () => {
        return false;
      };

      const result = await AccountService.AutoUpgradePreYearly(userArgs, opts);
      expect(result.code).to.be.equal(1);
    });

    it('Should create AutoUpgradePreYearly false', async () => {
      AdminPromotionModel.findOne = () => {
        return {
          allow_pre_signup: 1
        };
      };

      SubscriptionModel.findOne = () => {
        return false;
      };
      const error = new Error('Data is invalid');
      await sinon.stub(SubscriptionModel, 'findOne').throws(error);

      const result = await AccountService.AutoUpgradePreYearly(userArgs, opts);
      expect(result.code).to.be.equal(0);
    });
  });

  describe('GenerateDefaultSystemCollection', () => {
    afterEach(async () => {
    });

    it('Should create SystemCollection success', async () => {
      CollectionSystemUserGeneratedModel.create = () => {
        return true;
      };
      const result = await AccountService.GenerateDefaultSystemCollection(userArgs);
      expect(result.code).to.be.equal(1);
    });
  });

  describe('GenerateQuota', () => {
    afterEach(async () => {
    });

    it('Should create Quota false', async () => {
      QuotaModel.sequelize = {
        query: () => { return false; }
      };
      const result = await AccountService.GenerateQuota(userArgs);
      expect(result.code).to.be.equal(0);
    });

    it('Should create Quota success', async () => {
      QuotaModel.sequelize = {
        query: () => {
          return {
            code: true
          };
        }
      };
      const result = await AccountService.GenerateQuota(userArgs);
      expect(result.code).to.be.equal(1);
    });

    describe('UpdateQuota', () => {
      afterEach(async () => {
      });

      it('Should update Quota success', async () => {
        await sinon.stub(InternalAccountService, 'FloMailInternalGetByteFromQuota').callsFake(() => true);
        QuotaModel.update = () => {
          return true;
        };
        const result = await AccountService.UpdateQuota(userArgs);
        expect(result).to.be.equal(true);
      });
    });
  });

  describe('CheckAccountTestAndAddGroup', () => {
    afterEach(async () => {
    });
    beforeEach(async () => {
      GroupModel.findAll = () => {
        return false;
      };
      GroupUserModel.create = () => {
        return true;
      };
    });
    it('Should CheckAccountTestAndAddGroup success', async () => {
      Server.log = () => { };
      await AccountService.CheckAccountTestAndAddGroup({
        id: 1,
        username: 'web763e90_test001@flostage.com'
      }, '2');
      // expect(result.code).to.be.equal(1);
    });

    it('Should CheckAccountTestAndAddGroup success prefix', async () => {
      GroupModel.create = () => {
        return {
          dataValues: {
            id: 1, name: 'test group'
          }
        };
      };
      await AccountService.CheckAccountTestAndAddGroup({
        id: 1,
        username: 'web763e90_test001@flostage.com'
      });
    });
  });

  describe('RestrictedUsername', () => {
    afterEach(async () => {
    });

    it('Should validate RestrictedUsername success: type_matcher 0', async () => {
      const username = 'admin';
      const result = await AccountService.RestrictedUsername(username);
      expect(result).to.be.equal(true);
    });

    it('Should validate RestrictedUsername success: type_matcher 1', async () => {
      const username = '4r5e';
      const result = await AccountService.RestrictedUsername(username);
      expect(result).to.be.equal(true);
    });

    it('Should validate RestrictedUsername false: non-data', async () => {
      const username = 'not-exist-user';
      const result = await AccountService.RestrictedUsername(username);
      expect(result).to.be.equal(false);
    });
  });

  describe('Revoke Token', () => {
    it('Should revoke token ', async () => {
      const stubvalue = {
        access_token: '123',
        access_token_iv: '123'
      };

      AccessTokenModel.findAll = () => {
        return true;
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(AccessTokenModel, 'findAll').callsFake(() => stubvalue);
      await sinon.stub(AccessTokenModel, 'destroy').callsFake(() => true);
      const result = await AccountService.RevokeToken();
      expect(result).to.be.equal(true);
    });

    it('Should throw error when revoke token ', async () => {
      AccessTokenModel.findAll = () => {
        return true;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(AccessTokenModel, 'findAll').throws(error);
      const result = await AccountService.RevokeToken();
      expect(result).to.be.equal(false);
    });
  });

  describe('RevokeTokenByRefreshToken', () => {
    afterEach(async () => {
      CacheUtility.DestroyOAuthCache.restore(); // Unwraps the spy
    });

    it('Should validate RevokeToken By RefreshToken success', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findAll = () => {
        return [{
          id: '1',
          access_token_iv: 'iv',
          access_token: 'access_token'
        }];
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByRefreshToken(accessTokenInfo);
      expect(result).to.be.equal(true);
    });

    it('Should validate RevokeToken By RefreshToken success: empty accessToken', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findAll = () => {
        return [];
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByRefreshToken(accessTokenInfo);
      expect(result).to.be.equal(true);
    });

    it('Should validate RevokeToken By RefreshToken false: throw error', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findAll = () => {
        return [{
          id: '1',
          access_token_iv: 'iv',
          access_token: 'access_token'
        }];
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(AccessTokenModel, 'findAll').throws(error);
      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByRefreshToken(accessTokenInfo);
      expect(result).to.be.equal(false);
    });
  });

  describe('RevokeTokenByAccessToken', () => {
    afterEach(async () => {
      CacheUtility.DestroyOAuthCache.restore(); // Unwraps the spy
    });

    it('Should validate RevokeToken By AccessToken success', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findOne = () => {
        return {
          id: '1',
          access_token_iv: 'iv',
          access_token: 'access_token'
        };
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByAccessToken(accessTokenInfo);
      expect(result).to.be.equal(true);
    });

    it('Should validate RevokeToken By AccessToken success: empty accessToken', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findOne = () => {
        return [];
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByAccessToken(accessTokenInfo);
      expect(result).to.be.equal(true);
    });

    it('Should validate RevokeToken By AccessToken false: throw error', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findOne = () => {
        return {
          id: '1',
          access_token_iv: 'iv',
          access_token: 'access_token'
        };
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(AccessTokenModel, 'findOne').throws(error);
      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByAccessToken(accessTokenInfo);
      expect(result).to.be.equal(false);
    });
  });

  describe('RevokeTokenByDeviceUid', () => {
    afterEach(async () => {
      CacheUtility.DestroyOAuthCache.restore(); // Unwraps the spy
    });

    it('Should validate RevokeToken By DeviceUid success', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findAll = () => {
        return [{
          id: '1',
          access_token_iv: 'iv',
          access_token: 'access_token'
        }];
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByDeviceUid(accessTokenInfo);
      expect(result).to.be.equal(true);
    });

    it('Should validate RevokeToken By DeviceUid success: empty accessToken', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findAll = () => {
        return [];
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByDeviceUid(accessTokenInfo);
      expect(result).to.be.equal(true);
    });

    it('Should validate RevokeToken By DeviceUid false: throw error', async () => {
      const accessTokenInfo = {
        user_id: 1,
        refresh_token: 'refresh_token'
      };
      AccessTokenModel.findAll = () => {
        return {
          id: '1',
          access_token_iv: 'iv',
          access_token: 'access_token'
        };
      };
      AccessTokenModel.destroy = () => {
        return true;
      };

      const error = new Error('Data is invalid');
      await sinon.stub(AccessTokenModel, 'findAll').throws(error);
      await sinon.stub(CacheUtility, 'DestroyOAuthCache').callsFake(() => true);
      const result = await AccountService.RevokeTokenByDeviceUid(accessTokenInfo);
      expect(result).to.be.equal(false);
    });
  });

  // 
});
