/* eslint-disable prefer-regex-literals */
const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');
const { Op } = require('sequelize');

const {
    RolesModel,
    AdminModel
} = require('../models');

const UserRoleService = {
    FloUserRole: async (keyword, paging) => {
        const where = {};

        if (keyword) {
            where.name = { [Op.like]: `%${keyword}%` };
        }

        const roles = await RolesModel.findAll({
            where,
            raw: true,
            offset: paging.offset,
            limit: paging.limit
        });

        const newData = roles.map(item => {
            const { order_number, ...rest } = item;
            return rest;
        });

        return {
            statusCode: 200,
            data: newData
        };
    },

    FloUserRoleGetById: async (id) => {
        const role = await RolesModel.findByPk(id, { raw: true });

        if (!role) {
            return {
                statusCode: 404,
                message: "Role Not found"
            };
        }

        const { order_number, ...rest } = role;

        return {
            statusCode: 200,
            data: rest
        };
    },

    FloUserRoleCreate: async (postData) => {
        const maxRole = await RolesModel.max('role');

        const roleValue = (maxRole !== null) ? maxRole + 1 : 1;

        const role = await RolesModel.findOne({
            where: { name: postData.name },
            raw: true
        });

        if (role) {
            return {
                statusCode: 409,
                message: "Role already exists!"
            };
        }

        const currentTimestamp = Utils.Timestamp();

        const newRole = await RolesModel.create({
            name: postData.name,
            role: roleValue,
            order_number: currentTimestamp,
            created_date: currentTimestamp,
            updated_date: currentTimestamp
        });
        
        const { order_number, ...roleData } = newRole.get({ plain: true });

        return {
            statusCode: 201,
            data: roleData
        };
    },

    FloUserRoleUpdate: async (id, payload) => {
        const role = await RolesModel.findByPk(id, { raw: true });

        if (!role) {
            return {
                statusCode: 404,
                message: "Role Not found"
            };
        }

        const find_by_role_name = await RolesModel.findOne({
            where: { name: payload.name },
            raw: true
        });

        if (find_by_role_name) {
            return {
                statusCode: 409,
                message: "Role already exists !"
            };
        }

        const updateData = {
            name: payload.name,
            role: payload.role,
            updated_date: Utils.Timestamp()
        };

        const [updatedCount] = await RolesModel.update(updateData, {
            where: { id }
        });

        if (updatedCount !== 1) {
            return {
                statusCode: Code.INVALID_PAYLOAD_PARAMS,
                message: "Update fail, please try again later!"
            };
        }

        const dataUpdate = await RolesModel.findByPk(id, { raw: true });

        const { order_number, ...rest } = dataUpdate;

        return {
            statusCode: 200,
            data: rest
        };
    },

    FloUserRoleDelete: async (id) => {
        try {
            const role = await RolesModel.findByPk(id, { raw: true });

            if (!role) {
                return {
                    statusCode: 404,
                    message: "Role Not found"
                };
            }

            if ((role.name === 'PO' || role.role === 1 || role.role === 2)) {
                return {
                    statusCode: 403,
                    message: "Deleting the role is not allowed"
                };
            }
    
            const roleToBeDeleted = role.role;

            const adminRecords = await AdminModel.findAll({ where: { role: roleToBeDeleted } });

            const promises = [];
            adminRecords.forEach(adminRecord => {
                promises.push(adminRecord.destroy());
            });

            await Promise.all(promises);

            const isRoleDeleted = await RolesModel.destroy({ where: { id } });

            if (isRoleDeleted) {
                return {
                    statusCode: 204
                };
            } else {
                return {
                    statusCode: 400,
                    message: "Bad Request"
                };
            }
        } catch (error) {
            return {
                statusCode: 500,
                message: "Internal Server Error"
            };
        }
    },
};

module.exports = UserRoleService;
