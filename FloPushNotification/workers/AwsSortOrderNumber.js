/* eslint-disable max-len */
const Decimal = require('decimal.js');
const _ = require('lodash');
const { Op } = require('sequelize');
const AsyncForEach = require('await-async-foreach');
const { Consumer } = require('sqs-consumer');
const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

const MAX_ORDER_NUMBER = 999999;
const MIN_ORDER_NUMBER = -999999;
const {
    GenerateLocalList,
    MergeHandle,
    ConflictItem
} = require('../projects/default/utilities/MergeHandle');

const itemTypes = ['VTODO', 'URL', 'FILE', 'KANBAN', 'CANVAS'];

const MergeValidateData = (list, requestData, items) => {
    try {
        if (_.isEmpty(items) === true) {
            return [];
        }
        const result = _.clone(list);
        _.forEach(items, (item) => {
            const requestItem = _.find(requestData, { obj_id: item.id.toString() });
            if (_.isEmpty(requestItem) === false) {
                result.push(requestItem);
            }
        });
        return result;
    } catch (error) {
        throw error;
    }
};

const ModifyData = async (list, uid, userInfo, Model, Cache, AppsConstant, Utils, Graylog) => {
    try {        
        const cacheCurrentKey = Utils.CachePatterns(AppsConstant.BE_KEY_CACHE, 'SortObjects', uid, userInfo.id);
        if (_.isEmpty(list) === true) {
            console.log('SORT ORDER SUCCESS', uid);
            await Cache.set(cacheCurrentKey, 'DONE', AppsConstant.Redis.TTL);
            return false;
        }
        const ids = [];
        _.forEach(list, (item) => {
            ids.push(item.obj_id);
        });

        const deletedItems = await Model.deleted_items.findAll({
            attributes: ['item_id'],
            where: {
                item_type: { [Op.in]: itemTypes },
                user_id: userInfo.id,
                item_id: { [Op.in]: ids }
            }
        });
        
        const insertArgs = [];
        const updateArgs = [];
        _.forEach(list, (item) => {
            const deletedItem = _.find(deletedItems, {
                item_type: item.obj_type,
                user_id: userInfo.id,
                item_id: item.obj_id
            });

            if (_.isEmpty(deletedItem) === true) {
                const orderNumber = item.order_number.toString();
                const args = {
                    user_id: userInfo.id,
                    obj_id: item.obj_id,
                    obj_type: item.obj_type,
                    order_number: orderNumber
                };
                const conflictItem = ConflictItem(list, args);  
                if (_.isEmpty(conflictItem) === false) {
                    // TODO
                    args.message = `Handle Duplicate order_number ${orderNumber} fail`;
                    Graylog.SendLog('Sort Order fail', { message: args });
                } else {
                    switch (item.type) {
                        case 'new': {
                            insertArgs.push({
                                user_id: userInfo.id,
                                obj_id: item.obj_id,
                                obj_type: item.obj_type,
                                order_number: orderNumber,
                                created_date: Utils.Timestamp(),
                                updated_date: item.updated_date || Utils.Timestamp()
                            });
                                
                            break;
                        }
                        case 'change': {
                            if (_.isEmpty(item.objOrder) === true) {
                                insertArgs.push({
                                    user_id: userInfo.id,
                                    obj_id: item.obj_id,
                                    obj_type: item.obj_type,
                                    order_number: orderNumber,
                                    created_date: Utils.Timestamp(),
                                    updated_date: item.updated_date || Utils.Timestamp()
                                });
                            } else if (_.isEmpty(conflictItem) === true) {
                                updateArgs.push({
                                    args: {
                                        user_id: userInfo.id,
                                        obj_id: item.obj_id,
                                        obj_type: item.obj_type,
                                        order_number: orderNumber,
                                        updated_date: item.updated_date || Utils.Timestamp()
                                    },
                                    condition: {
                                        where: {
                                            id: item.objOrder.id
                                        }
                                    }
                                });
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }
            }
        });
        
        try {
            if (_.isEmpty(insertArgs) === false) {
                await Model.sort_objects.bulkCreate(insertArgs);
            }
            
            if (_.isEmpty(updateArgs) === false) {
                _.forEach(updateArgs, (item) => {
                    Model.sort_objects.update(item.args, item.condition).catch(() => {
                        // TODO
                        const message = `Handle Duplicate order_number ${item.args.obj_id}: ${item.args.order_number} fail`;
                        Graylog.SendLog('Sort Order fail', { message });
                    });
                });
            }

            await Cache.set(cacheCurrentKey, 'DONE', AppsConstant.Redis.TTL);
            console.log('SORT ORDER SUCCESS', uid);
            return true;
        } catch (error) {
            throw error;
        }
    } catch (error) {
        throw error;
    }
};

const ValidateData = async (requestData, userInfo, Model, Utils, Graylog) => {
    try {
        const data = _.filter(requestData, (item) => {
            const orderNumber = new Decimal(item.order_number);
            return _.indexOf(itemTypes, item.obj_type) >= 0 && orderNumber.lte(MAX_ORDER_NUMBER) && orderNumber.gte(MIN_ORDER_NUMBER);
        });
        if (_.isEmpty(data) === true) {
            console.log('SORT ORDER REJECTED', 'Empty request data or Invalid data value such as obj_type,order_number');
            Graylog.SendLog('Worker sort Order: rejected', { message: 'Empty request data or Invalid data value such as obj_type,order_number' });
            return [];
        }
        const groupItemsType = {};
        _.forEach(itemTypes, (itemType) => {
            groupItemsType[itemType] = [];
        });

        _.forEach(data, (item) => {
            groupItemsType[item.obj_type].push(item.obj_id);
        });
        let result = [];
        await AsyncForEach(groupItemsType, async (groupItemIds, type) => {
            switch (type) {
                case 'VTODO': {
                    const principaluri = `principals/${userInfo.email}`;
                    const items = await Model.calendarobjects.findAll({
                        attributes: [['uid', 'id']],
                        raw: true,
                        where: {
                            uid: {
                                [Op.in]: groupItemIds
                            },
                            componenttype: 'VTODO'
                        },
                        include: [{
                            model: Model.calendars,
                            attributes: [],
                            as: 'calendar',
                            where: {
                                principaluri: Buffer.from(principaluri, 'utf8')
                            }
                        }]
                    });
                    
                    if (_.isEmpty(items) === false) {
                        result = MergeValidateData(result, requestData, items, Utils);
                    }
                    break;
                }
                case 'URL': {
                    const items = await Model.urls.findAll({
                        attributes: ['id'],
                        raw: true,
                        where: {
                            user_id: userInfo.id,
                            id: { [Op.in]: groupItemIds }
                        }
                    });
                    if (_.isEmpty(items) === false) {
                        result = MergeValidateData(result, requestData, items, Utils);
                    }
                    break;
                }
                case 'FILE': {
                    const items = await Model.cloud_storages.findAll({
                        attributes: ['id'],
                        raw: true,
                        where: {
                            user_id: userInfo.id,
                            id: { [Op.in]: groupItemIds }
                        }
                    });
                    if (_.isEmpty(items) === false) {
                        result = MergeValidateData(result, requestData, items, Utils);
                    }

                    break;
                }
                case 'KANBAN': {
                    const items = await Model.kanbans.findAll({
                        attributes: ['id'],
                        raw: true,
                        where: {
                            id: { [Op.in]: groupItemIds },
                            user_id: userInfo.id
                        }
                    });
                    if (_.isEmpty(items) === false) {
                        result = MergeValidateData(result, requestData, items, Utils);
                    }

                    break;
                }
                case 'CANVAS': {
                    const items = await Model.canvas_detail.findAll({
                        attributes: ['id'],
                        raw: true,
                        where: {
                            id: { [Op.in]: groupItemIds },
                            user_id: userInfo.id
                        }
                    });

                    if (_.isEmpty(items) === false) {
                        result = MergeValidateData(result, requestData, items, Utils);
                    }
                    break;
                }
                default:
                    break;
            }
        });
        return result;
    } catch (error) {
        throw error;
    }
};

const QueueHandle = async (message, Model, Cache, AppsConstant, Utils, Graylog) => {
    try {
        if (_.isEmpty(message) === true) {
            return false;
        }
        
        const body = JSON.parse(message.Body);
        const cacheKey = `userInfo_${body.email}}`;
        const cacheData = await Cache.get(cacheKey);
        let userInfo = cacheData ? JSON.parse(cacheData) : {};
        if (_.isEmpty(userInfo) === true) {
            userInfo = await Model.users.findOne({
                where: {
                    email: body.email,
                    disabled: false
                },
                raw: true
            });
            if (_.isEmpty(userInfo) === true) {
                return false;
            }
            
            await Cache.set(cacheKey, JSON.stringify({
                id: userInfo.id,
                email: userInfo.email
            }), AppsConstant.Redis.TTL);
        }
        
        const cacheCurrentKey = Utils.CachePatterns(AppsConstant.BE_KEY_CACHE, 'SortObjects', body.uid, userInfo.id);
        const cacheState = await Cache.get(cacheCurrentKey);
        
        // TODO
        if (cacheState !== 'INIT' && cacheState !== 'IN_PROCESS') {
            return false;
        }

        const localData = await GenerateLocalList(body.email, userInfo, Model);
        if (localData === false) {
            return false;
        }
        
        const requestData = await ValidateData(_.clone(body.items), userInfo, Model, Utils, Graylog);
        const list = MergeHandle(localData, requestData);        
        await ModifyData(list, body.uid, userInfo, Model, Cache, AppsConstant, Utils, Graylog);
        return true;
    } catch (error) {
        throw error;
    }
};

(async () => {
    try {
        // TODO    
        await AwsSystemParameterStore.Init();
        console.log('** Start worker sort order number');
        const AwsConstant = require('./supports/AwsConstant');
        const accountId = AwsConstant.ACCOUNT_ID;
        const queueName = AwsConstant.SORT_OBJECT_QUEUE_NAME;
        const Model = require('./supports/model');
        const Cache = require('./supports/Cache');
        const AppsConstant = require('../projects/default/constants/AppsConstant');
        const Utils = require('../projects/default/utilities/Utils');
        const Graylog = require('./supports/utilities/GrayLog');    
        // TODO
        const app = Consumer.create({
            queueUrl: `https://sqs.${AwsConstant.REGION}.amazonaws.com/${accountId}/${queueName}`,
            handleMessage: async (message) => {
                await QueueHandle({
                    Id: message.MessageId,
                    Body: message.Body
                }, Model, Cache, AppsConstant, Utils);

                Graylog.SendLog('Worker Sort Order', { message });
            }
        });

        app.on('error', async (err) => {
            console.log('Sort Order error', JSON.stringify(err, Utils.replaceErrors));
        });

        app.on('processing_error', (err) => {
            console.log('Sort Order error', JSON.stringify(err, Utils.replaceErrors));
        });

        app.start();
    } catch (error) {
        process.exit(1);
        // throw error;
    }
})();

