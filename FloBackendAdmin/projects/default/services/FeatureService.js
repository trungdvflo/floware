/* eslint-disable prefer-regex-literals */
const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');
const { Op } = require('sequelize');

const {
    FeatureModel,
} = require('../models');

const FeatureService = {
    FloAllFeaturePermission: async (keyword, paging) => {
        const where = {};

        if (keyword) {
            where.api_name = { [Op.like]: `%${keyword}%` };
        }

        const features = await FeatureModel.findAll({
            where,
            raw: true,
            offset: paging.offset,
            limit: paging.limit
        });

        return {
            statusCode: 200,
            data: features
        };
    },

    FloGetFeaturePermissionById: async (id) => {
        const feature = await FeatureModel.findByPk(id, { raw: true });

        if (!feature) {
            return {
                statusCode: 404,
                message: "Feature Not found"
            };
        }

        return {
            statusCode: 200,
            data: feature
        }
    },

    FloCreateFeaturePermission: async (payload) => {
        const feature = await FeatureModel.findOne({
            where: { api_name: payload.api_name },
            raw: true
        });

        if(feature) {
            return {
                statusCode: 409,
                message: "Feature already exists !"
            };
        }

        const currentTimestamp = Utils.Timestamp();

        const newFeature = await FeatureModel.create({
            api_name: payload.api_name,
            method: payload.method,
            parent_id: payload.parent_id,
            created_by: payload.created_by,
            order_number: currentTimestamp,
            created_date: currentTimestamp,
            updated_date: currentTimestamp
        });

        return {
            statusCode: 201,
            data: newFeature
        };
    },

    FloFeaturePermission: async (id, payload) => {
        const feature = await FeatureModel.findByPk(id, { raw: true });

        if (!feature) {
            return {
                statusCode: 404,
                message: "Feature Not found"
            };
        }

        const find_by_api_name = await FeatureModel.findOne({
            where: { api_name: payload.api_name },
            raw: true
        });

        if(find_by_api_name) {
            return {
                statusCode: 409,
                message: "Feature already exists !"
            };
        }

        const updateData = {
            api_name: payload.api_name,
            method: payload.method,
            parent_id: payload.parent_id,
            updated_date: Utils.Timestamp()
        };

        const [updatedCount] = await FeatureModel.update(updateData, {
            where: { id }
        });

        if (updatedCount !== 1) {
            return {
                statusCode: Code.INVALID_PAYLOAD_PARAMS,
                message: "Update fail, please try again later!"
            };
        }

        const dataUpdate = await FeatureModel.findByPk(id, { raw: true });

        return {
            statusCode: 200,
            data: dataUpdate
        };
    },

    FloDeleteFeature: async (id) => {
        const feature = await FeatureModel.findByPk(id, { raw: true });

        if (!feature) {
            return {
                statusCode: 404,
                message: "Feature Not found"
            };
        }

        const isDeleted = await FeatureModel.destroy({
            where: {
                id: feature.id
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

module.exports = FeatureService;
