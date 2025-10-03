const _ = require('lodash');
const EmailGroupService = require('../services/EmailGroupService');
const Utils = require('../utilities/Utils');
const Server = require('../app').server;
const Code = require('../constants/ResponseCodeConstant');

const permissions = [1];

const responseWithError = (h, statusCode, message) => {
  return h.response({
    code: parseInt(statusCode),
    error: {
      message: message
    }
  }).code(parseInt(statusCode));
};

const responseWithData = (h, statusCode, data) => {
  return h.response({
    code: parseInt(statusCode),
    data: data
  }).code(parseInt(statusCode));
};

const responseWithNoData = (h, statusCode, message) => {
  return h.response({
    code: parseInt(statusCode),
    error: {
      message: message
    }
  }).code(parseInt(statusCode));
};


const getAllEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  try {
    const { headers, query } = request;
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const result = await EmailGroupService.FloEmailGroupAdmin(headers, paging);
    
    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    return responseWithData(h, result.code, result.data);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const getEmailGroupById = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  try {
    const { headers, params } = request;
    const { id } = params;
    const result = await EmailGroupService.FloEmailGroupById(id, headers);

    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    if (result.statusCode !== 200) {
      return responseWithError(h, result.statusCode, result.message);
    }
    return responseWithData(h, result.statusCode, result.data);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const createEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  try {
    const { headers, payload } = request;
    const result = await EmailGroupService.FloEmailGroupCreate(headers, payload);
    
    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    if (result.statusCode !== 201) {
      return responseWithError(h, result.statusCode, result.message);
    }
    return responseWithData(h, result.statusCode, result.data);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const updateEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  try {
    const { headers, payload, params } = request;
    const { id } = params;
    const result = await EmailGroupService.FloEmailGroupUpdate(id, headers, payload);
    
    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    if (result.statusCode !== 200) {
      return responseWithError(h, result.statusCode, result.message);
    }
    return responseWithData(h, result.statusCode, result.data);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const deleteEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  const { headers, params } = request;
  const { id } = params;
  const result = await EmailGroupService.FloEmailGroupDelete(id, headers);

  if (!result) {
    return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
  }

  if (result.statusCode !== 204) {
    return responseWithError(h, result.statusCode, result.message);
  }
  
  return responseWithNoData(h, result.statusCode, result.message);
};


//implement for add/remove user to emailGroup
const getAllUserInEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  try {
    const { headers, params, query } = request;
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const { id } = params;

    const result = await EmailGroupService.GetAllUserInEmailGroup(id, headers, paging);
    
    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    if (result.statusCode !== 200) {
      return responseWithError(h, result.statusCode, result.message);
    }
    return responseWithData(h, result.statusCode, result.data);

  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const addMemberToEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  try {
    const { headers, payload, params } = request;
    const { id } = params;
    const result = await EmailGroupService.AddMemberToEmailGroup(id, headers, payload);
    
    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    if (result.statusCode !== 201) {
      return responseWithError(h, result.statusCode, result.message);
    }
    return responseWithData(h, result.statusCode, result.data);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const removeMemberFromEmailGroup = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissions) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }
  try {
    const { headers, payload, params } = request;
    const { id } = params;
    const result = await EmailGroupService.RemoveMemberFromEmailGroup(id, headers, payload);

    if (!result) {
      return responseWithError(h, Code.NOT_FOUND, "User Group information not found");
    }

    if (result.statusCode !== 201) {
      return responseWithError(h, result.statusCode, result.message);
    }
    return responseWithData(h, result.statusCode, result.data);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

module.exports = {
  getAllEmailGroup,
  getEmailGroupById,
  createEmailGroup,
  updateEmailGroup,
  deleteEmailGroup,
  getAllUserInEmailGroup,
  addMemberToEmailGroup,
  removeMemberFromEmailGroup
};
