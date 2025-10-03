/* eslint-disable prefer-regex-literals */
const AppsConstant = require('../constants/AppsConstant');
const Request = require('../utilities/Request');
const Server = require('../app').server;

const EmailGroupService = {
  FloEmailGroupAdmin: async (headers, paging) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/items`;
      const params = {
        offset: paging.offset,
        max_rows: paging.limit
      };
      const result = await Request.Get(url, headers.authorization, params, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.statusCode !== 200) {
        return null;
      }
      const body = typeof result.body === 'string'
        ? JSON.parse(result.body)
        : result.body;
      const emailGroupData = body.map(({ domain_id, ...obj }) => obj);
      return {
        code: result.statusCode,
        data: emailGroupData
      };
    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },

  FloEmailGroupById: async (id, headers) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/${id}`;
      const result = await Request.Get(url, headers.authorization, {}, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      
      if (result.body.statusCode !== 200) {
        return result.body
      }

      delete result.body.data.domain_id;    
      return result.body;

    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },

  FloEmailGroupCreate: async (headers, postData) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group`;
      const result = await Request.Post(url, headers.authorization, postData, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.body.statusCode !== 201) {
        return result.body
      }
      delete result.body.data.domain_id;
      return result.body;
    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },

  FloEmailGroupUpdate: async (id, headers, updateData) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/${id}`;
      const result = await Request.Put(url, headers.authorization, id, updateData, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.body.statusCode !== 200) {
        return result.body
      }

      delete result.body.data.domain_id;

      return result.body;
    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },

  FloEmailGroupDelete: async (id, headers) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/${id}`;
      const result = await Request.Delete(url, headers.authorization, id, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);

      if (result.body.statusCode !== 204) {
        return result.body
      }
      return result.body;
    } catch (error) {
      Server.log(['error'], error);
      return false;
    }
  },

  //implement for add/remove user to emailGroup
  GetAllUserInEmailGroup: async (id, headers, paging) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/${id}/members`;
      const params = {
        offset: paging.offset,
        max_rows: paging.limit
      };
      const result = await Request.Get(url, headers.authorization, params, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
  
      if (result.body.statusCode !== 200) {
        return result.body;
      }
  
      const processUser = user => {
        const { user_id, ...rest } = user;
        return rest;
      };
  
      result.body.data = Array.isArray(result.body.data)
        ? result.body.data.map(processUser)
        : processUser(result.body.data);
  
      return result.body;
    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },
  

  AddMemberToEmailGroup: async (id, headers, postData) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/${id}/add-member`;
      const result = await Request.Post(url, headers.authorization, postData, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);

      if (result.body.statusCode !== 201) {
        return result.body
      }

      delete result.body.data.user_id;

      return result.body;
    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },

  RemoveMemberFromEmailGroup: async (id, headers, postData) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/email-group/${id}/remove-member`;
      const result = await Request.Post(url, headers.authorization, postData, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.body.statusCode !== 201) {
        return result.body
      }
      return result.body;
    } catch (error) {
      Server.log(['error'], error);
      return null;
    }
  },

};
module.exports = EmailGroupService;
