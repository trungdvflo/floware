const _ = require('lodash');
const AdminUserService = require('../services/AdminUserService');
const Utils = require('../utilities/Utils');
const Server = require('../app').server;
const Code = require('../constants/ResponseCodeConstant');

const permissions = [1];

const responseMultiple40 = (h, statusCode, data, errors) => {
    const error = (errors && errors.length)? ({ errors }) : undefined;
    return h.response({
        code: statusCode,
        data,
        error
    }).code(statusCode);
};

const responseWithMultipleStatus = (h, statusCode, data) => {
    return h.response({
        code: statusCode,
        status: data
    }).code(statusCode);
};

const responseWithError = (h, statusCode, message) => {
    return h.response({
        code: statusCode,
        error: {
            message: message
        }
    }).code(statusCode);
};

const responseWithData = (h, statusCode, data) => {
    return h.response({
        code: statusCode,
        data: data
    }).code(statusCode);
};

function checkQueryParams(query) {
    let errorMessages = [];

    if (!query) {
        errorMessages.push("Query object is missing or empty");
    } else {
        if (!Number.isInteger(query.page)) {
            errorMessages.push("page must be an integer");
        } else if (query.page <= 0) {
            errorMessages.push("page must be a positive integer");
        }

        if (!Number.isInteger(query.max_rows)) {
            errorMessages.push("max_rows must be an integer");
        } else if (query.max_rows <= 0) {
            errorMessages.push("max_rows must be a positive integer");
        }
    }

    if (errorMessages.length > 0) {
        if (errorMessages.length === 2) {
            return "page and max_rows must be an integer";
        } else {
            return errorMessages;
        }
    } else {
        return true;
    }
}

const getAllAdminUser = async (request, h) => {
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
        const { query } = request;
        const checkParamsResult = checkQueryParams(query);
        if (checkParamsResult !== true) {
            return responseWithError(h, Code.INVALID_PAYLOAD_PARAMS, checkParamsResult);
        }
        const paging = Utils.HandlePaging(query.page, query.max_rows);
        const result = await AdminUserService.FloAdminUser(_.trim(query.keyword), query.role, paging);

        if (!result) {
            return responseWithError(h, Code.NOT_FOUND, "User information not found");
        }

        return responseWithData(h, result.statusCode, result.data);
    } catch (error) {
        Server.log(['error'], error);
        throw error;
    }
};

const getAdminUserById = async (request, h) => {
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
        const { params } = request;
        const { id } = params;
        const result = await AdminUserService.FloAdminUserById(id);

        if (!result) {
            return responseWithError(h, Code.NOT_FOUND, "User information not found");
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

const createAdminUser = async (request, h) => {
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
        const { payload } = request;
        const result = await AdminUserService.FloAdminUserCreate(payload, userInfo.email);

        if (!result) {
            return responseWithError(h, Code.NOT_FOUND, "User information not found");
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

const deleteAdminUser = async (request, h) => {
    const userInfo = _.get(request, 'auth.credentials', false);
    if (Utils.RolePermission(userInfo, permissions) === false) {
        return h
            .response({
                code: Code.INVALID_PERMISSION,
                error: {
                    message: 'You don\'t have permission to perform this action'
                }
            }).code(Code.INVALID_PERMISSION);
    }

    try {
        const { payload } = request;
        const { data } = payload;
        const result = await AdminUserService.FloAdminUserDelete(data, userInfo.email);

        if (!result) {
            return responseWithError(h, Code.NOT_FOUND, "User information not found");
        }

        return responseMultiple40(h, result.statusCode, result.successes, result.errors);
    } catch (error) {
        Server.log(['error'], error);
        throw error;
    }
};

module.exports = {
    getAllAdminUser,
    getAdminUserById,
    createAdminUser,
    deleteAdminUser
};
