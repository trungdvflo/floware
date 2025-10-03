/* eslint-disable prefer-regex-literals */
const Utils = require('../utilities/Utils');

const {
    PermissionModel,
} = require('../models');

const PermissionService = {
    FloPermissionRole: async (paging) => {
        const permissions = await PermissionModel.findAll({
            raw: true,
            offset: paging.offset,
            limit: paging.limit
        });

        return {
            statusCode: 200,
            data: permissions
        };
    },

    postPermissionRole: async (postData) => {
        const permission = await PermissionModel.findOne({
            where: { role_id: postData.role_id },
            raw: true
        });

        if(permission) {
            return {
                statusCode: 409,
                message: "Permission already exists !"
            };
        }

        const currentTimestamp = Utils.Timestamp();

        const newPermission = await PermissionModel.create({
            feature_id: postData.feature_id,
            role_id: postData.role_id,
            permission_value: postData.permission_value,

            created_date: currentTimestamp,
            updated_date: currentTimestamp
        });

        return {
            statusCode: 201,
            data: newPermission
        };
    },

    putPermissionRole: async (id, payload) => {
        const permission = await PermissionModel.findByPk(id, { raw: true });

        if (!permission) {
            return {
                statusCode: 404,
                message: "Permission Not found"
            };
        }

        const permissionRoleId = await PermissionModel.findOne({
            where: { role_id: payload.role_id },
            raw: true
        });

        const updateData = {
            feature_id: payload.feature_id,
            role_id: permissionRoleId ? permissionRoleId.role_id : payload.role_id ,
            permission_value: payload.permission_value,
            updated_date: Utils.Timestamp()
        };

        const [updatedCount] = await PermissionModel.update(updateData, {
            where: { id }
        });

        if (updatedCount !== 1) {
            return {
                statusCode: Code.INVALID_PAYLOAD_PARAMS,
                message: "Update fail, please try again later!"
            };
        }

        const dataUpdate = await PermissionModel.findByPk(id, { raw: true });

        return {
            statusCode: 200,
            data: dataUpdate
        };
    },

    deletePermissionRole: async (id) => {
        const permission = await PermissionModel.findByPk(id, { raw: true });

        if (!permission) {
            return {
                statusCode: 404,
                message: "Permission Not found"
            };
        }

        const isDeleted = await PermissionModel.destroy({
            where: {
                id: permission.id
            }
        });

        if (isDeleted) {
            return {
                statusCode: 204
            };
        } else {
            return {
                statusCode: 400,
                message: "Bad Request"
            };
        }
    },
};

module.exports = PermissionService;
