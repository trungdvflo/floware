/* eslint-disable prefer-regex-literals */
const Utils = require('../utilities/Utils');
const { Op } = require('sequelize');

const {
    AdminModel,
    RolesModel,
    VirtualDomainsModel
} = require('../models');

const AdminUserService = {
    FloAdminUser: async (keyword, role, paging) => {
        const where = {};

        if (keyword) {
            where.email = { [Op.like]: `%${keyword}%` };
        }

        if (role) {
            where.role = role;
        }

        const queryOptions = {
            where,
            attributes: { exclude: ['time_code_expire', 'verify_code', 'receive_mail'] },
            raw: true,
            offset: paging.offset,
            limit: paging.limit
        };

        const adminUsers = await AdminModel.findAll(queryOptions);

        return {
            statusCode: 200,
            data: adminUsers
        };
    },

    FloAdminUserById: async (id) => {
        const adminUser = await AdminModel.findByPk(id, {
            attributes: { exclude: ['time_code_expire', 'verify_code', 'receive_mail'] },
            raw: true
        });

        if (!adminUser) {
            return {
                statusCode: 404,
                message: `User with ID ${id} Not found`,
            };
        }

        return {
            statusCode: 200,
            data: adminUser
        };
    },

    FloAdminUserCreate: async (payload, currentEmail) => {
        const { data, role } = payload;

        if (data.length <= 0) {
            return { statusCode: 400, message: "Invalid data provided" };
        }

        const domainNames = (await VirtualDomainsModel.findAll({ attributes: ['name'] })).map(({ name }) => name);
        const invalidDomain = data.filter(item => !domainNames.includes(item.email.split('@')[1]));

        if (invalidDomain.length > 0) {
            return { statusCode: 403, message: `The domain is not included in Flo's supported list` };
        }

        const UserRole = await RolesModel.findOne({ where: { role }, raw: true });

        if (!UserRole) {
            return { statusCode: 404, message: "Role Not found" };
        }

        const results = [];

        for (const item of data) {
            let [updatedUser, created] = await AdminModel.findOrCreate({
                where: { email: item.email },
                defaults: {
                    email: item.email,
                    verify_code: 0,
                    time_code_expire: 0,
                    role,
                    role_id: UserRole.id,
                    created_date: Utils.Timestamp(Date.now()),
                    updated_date: Utils.Timestamp(Date.now())
                },
                raw: true,
            });

            if (!created) {
                const existingUser = await AdminModel.findOne({ where: { email: item.email }, raw: true });

                if (existingUser.email.toLowerCase() === currentEmail.toLowerCase() && existingUser.role === 1) {
                    return { statusCode: 403, message: "Not allowed to perform actions on your own account" };
                }

                await AdminModel.update({
                    role,
                    role_id: UserRole.id,
                    updated_date: Utils.Timestamp(Date.now())
                }, {
                    where: {
                        email: item.email
                    }
                });

                updatedUser = await AdminModel.findOne({ where: { email: item.email } });
            }

            results.push({
                id: updatedUser.id,
                email: updatedUser.email,
                role: role,
                order_number: updatedUser.order_number,
                created_date: updatedUser.created_date,
                updated_date: updatedUser.updated_date || Utils.Timestamp(Date.now()),
            });
        }

        const errorResult = results.find(result => result.statusCode === 403);

        if (errorResult) {
            return errorResult;
        }

        return { statusCode: 201, data: results };
    },

    FloAdminUserDelete: async (data, currentEmail) => {
        let statusCode = 200;
        const successes = [];
        const errors = [];
        let countSuccess = 0;

        for (const item of data) {
            const adminUser = await AdminModel.findByPk(item.id, { raw: true });

            if (!adminUser) {
                errors.push({
                    code: 'notFound',
                    message: `User with ID ${item.id} Not found`,
                    attributes: item
                });
                continue;
            }
            if (adminUser.email === currentEmail && adminUser.role === 1) {
                errors.push({
                    code: 'notAllowed',
                    message: "Not allowed to perform actions on your own account",
                    attributes: item
                });
                continue;
            }
            if (adminUser.role === 1) {
                errors.push({
                    code: 'notPermission',
                    message: `User with ID ${item.id} has a role of 'PO' and cannot be deleted`,
                    attributes: item
                });
                continue;
            }

            const isDeleted = await AdminModel.destroy({
                where: {
                    id: adminUser.id
                }
            });
            if (!isDeleted) {
                errors.push({
                    code: 'failItem',
                    message: `Failed to delete admin ID ${item.id}`,
                    attributes: item
                });
                continue;
            }

            countSuccess++;
            successes.push(item);
        }
        if (countSuccess === 0) {
            statusCode = 400;
        } else if (successes < data.length) {
            statusCode = 207;
        }

        return {
            statusCode,
            successes,
            errors
        };
    }

};

module.exports = AdminUserService;
