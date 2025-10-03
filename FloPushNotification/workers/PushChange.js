/* eslint-disable no-console */
// const { Consumer } = require('sqs-consumer');
const { CronJob } = require('cron');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const ReportCachedUsers = require('./supports/utilities/ReportCachedUsers');
const ApiLastModified = require('./supports/utilities/ApiLastModified');
const AsyncForEach = require('await-async-foreach');
const _ = require('lodash');

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');
const numberPart = 10;
const TIMEOUT = 10;
const ENV_SILENT_VALID = [0, 1];

(async () => {
    try {
        await AwsSystemParameterStore.Init();
        const PushChange = require('./supports/utilities/PushChange');

        // Start Worker

        const AwsConstant = require('./supports/AwsConstant');
        const AppleSilentPushChangeAPI = require('../projects/default/services/AppleSilentPushChangeAPI');
        // const DeviceTokenModel = require('../projects/default/models/Sequelize/DeviceTokenModel');
        // const ConfigPushSilentModel = require('../projects/default/models/Sequelize/ConfigPushSilentModel');
        const Graylog = require('./supports/utilities/GrayLog');
        const Model = require('./supports/model');
        // const { GetDataByType, GetTable } = require('./supports/utilities/FilterDataType');

        let users_running = [];
        const CronPushChange = new CronJob({
            // cronTime: '*/5 * * * *', // 5 minutes
            cronTime: `*/${TIMEOUT} * * * * *`,
            onTick: async () => {
                console.log(`running a task every ${TIMEOUT} second`);
                run();

                async function run() {
                    try {
                        // # get config push silent
                        // const config = await ConfigPushSilentModel.findOne({
                        //     raw: true
                        // });
                        const config = {
                            interval_stop_push: 10800
                        };
                        const now = Date.now() / 1000;
                        // const timeCompare = now - TIMEOUT;
                        const timeCompare = now; // current don't use on Get List
                        Graylog.SendLogPushChange('timeCompare:', timeCompare);

                        pushChanges = await PushChange.GetList(
                            Model,
                            timeCompare,
                            Graylog
                        );
                        let arrBatchUserChanged = _.chunk(pushChanges, numberPart);
                        // Graylog.SendLogPushChange('LengthItem:', pushChanges.length);
                        // Graylog.SendLogPushChange('NumberofBatch:', arrBatchUserChanged.length);
                        // Graylog.SendLogPushChange('pushChanges:', JSON.stringify(pushChanges));
                        Graylog.SendLogPushChange('arrBatchUserChanged:', JSON.stringify(arrBatchUserChanged));
                        await AsyncForEach(arrBatchUserChanged, async (pushChangesBatch) => {
                            // console.log(_.map(pushChangesBatch, (u) => u.user_id ));
                            let objOr = [];
                            let objWhere = {
                                [Op.or]: objOr,
                                [Op.and]: {
                                    api_name: {
                                        [Op.ne]: 'devicetoken'
                                    }
                                }
                            };
                            _.each(pushChangesBatch, pushChange => {
                                // console.log(`pushChange['created_date']: ${pushChange['created_date']}, pushChange['user_id']: ${pushChange['user_id']}`);
                                objOr.push({
                                    [Op.and]: {
                                        api_last_modified: {
                                            [Op.gt]: pushChange['created_date']
                                        },
                                        user_id: {
                                            [Op.eq]: pushChange['user_id']
                                        }
                                    }
                                });
                            });

                            let apiLastModifiedOfBatchUser = await Model.api_last_modified.findAll({
                                where: objWhere,
                                group: ['user_id', 'id'],
                                raw: true
                            });
                            Graylog.SendLogPushChange('apiLastModifiedOfBatchUser:', `${JSON.stringify(apiLastModifiedOfBatchUser)}`);
                            let apiLastModifiedGroupUserId = _.groupBy(apiLastModifiedOfBatchUser, (alm) => {
                                return alm.user_id
                            });

                            await AsyncForEach(pushChangesBatch, async (pushChange) => {
                                const userId = pushChange.user_id;
                                const createdDate = pushChange.created_date;

                                // console.log(!!_.find(users_running, (userIdRuning) => userIdRuning == userId));
                                // if (!!_.find(users_running, (userIdRuning) => userIdRuning == userId)) {
                                //     console.log(`not run userId: ${userId}`);
                                //     return null;
                                // } else {
                                //     users_running.push(userId);
                                //     console.log(`add to list ${users_running}`);
                                // }

                                // Push Change don't get > current time - TIMEOUT
                                // let ApiLastModifiedOfUser = await Model.api_last_modified.findAll({
                                //     where: {
                                //         api_last_modified: {
                                //             [Op.gt]: createdDate
                                //         },
                                //         user_id: {
                                //             [Op.eq]: userId
                                //         }
                                //     }
                                // });
                                // optimize for many query
                                let ApiLastModifiedOfUser = apiLastModifiedGroupUserId[userId]
                                Graylog.SendLogPushChange(`ApiLastModifiedOfUser ${userId}`, _.isEmpty(ApiLastModifiedOfUser) ? 'blank' : JSON.stringify(ApiLastModifiedOfUser));

                                if(!_.isEmpty(ApiLastModifiedOfUser)) {
                                    let data = []
                                    _.each(ApiLastModifiedOfUser, (tableChange) => {
                                        // data.push(tableChange.api_name);
                                        data.push([tableChange.api_name, tableChange.api_last_modified]);
                                    });
                                    const deviceToken = await Model.device_token.findAll({
                                        where: {
                                            user_id: userId,
                                            [Op.and]: [
                                                Sequelize.where(Sequelize.literal('time_sent_silent - time_received_silent'), {
                                                    [Op.lte]: config.interval_stop_push
                                                })
                                            ]
                                        },
                                        raw: true
                                    });
                                    const devicePush = {};
                                    if (deviceToken.length > 0) {
                                        const listDevices = {};
                                        deviceToken.map((i) => {
                                            listDevices[`${i.device_type}${i.cert_env}`] = {
                                                '0': [],
                                                '1': []
                                            };
                                            return null;
                                        });
                                        deviceToken.map((i) => {
                                            if(!_.isNumber(i.env_silent)) {
                                                return null;
                                            }
                                            if (_.includes(ENV_SILENT_VALID, i.env_silent)) {
                                                listDevices[`${i.device_type}${i.cert_env}`][i.env_silent].push(i.device_token);
                                            } else {
                                                Graylog.SendLogPushChange(`env_silent invalid`, ` with value: ${i.env_silent} of device_token ${i.device_token}`);
                                            }
                                            return null;
                                        });
                                        devicePush[`${userId}`] = listDevices;
                                    }
                                    Graylog.SendLogPushChange(`devicePush of ${userId}:`, JSON.stringify(devicePush[userId]));
                                    if (_.isEmpty(devicePush[userId])) {
                                        console.log(`not exits device on acc ${userId}`);
                                        let maxApiLastModified = _.maxBy(ApiLastModifiedOfUser, (ApiLastModifiedOfUserWithOneRow) => {
                                            return ApiLastModifiedOfUserWithOneRow.api_last_modified
                                        });

                                        console.log('maxApiLastModified:');
                                        console.log(maxApiLastModified.api_last_modified);

                                        if (!_.isEmpty(maxApiLastModified) && !_.isNull(maxApiLastModified.api_last_modified)) {
                                            Graylog.SendLogPushChange(`updating push_change: ${maxApiLastModified.api_last_modified}, now: ${now}`, maxApiLastModified.api_last_modified < now);
                                            Model.push_change.update(
                                            {
                                                created_date: maxApiLastModified.api_last_modified
                                            },
                                            {
                                                where: {
                                                    id: {
                                                        [Op.in]: [pushChangesBatch.find(({ user_id }) => user_id == userId).id]
                                                    }
                                                }
                                            });
                                            // console.log('updated push_change');
                                        }
                                    }
                                    await AsyncForEach(devicePush[userId], async (val, pemFileName) => {
                                        // console.log('** object Push: ', val, pemFileName);
                                        _.forEach(AwsConstant.KEY_MAP_PUSH_NOTIFY, (bundleId, pemName) => {
                                            // console.log('** Platform: ', pemFileName, val[0], '** Bundle: ', bundleId, pemName);
                                            if (pemFileName == pemName) {
                                                // console.log(`deviceToken: ${JSON.stringify(deviceToken)}`);
                                                // console.log(data);
                                                _.each(val, (deviceTokenGroup, key) => {
                                                    // console.log(deviceTokenGroup, key, 'xxx');
                                                    const showPush = (key == 1 ? true : false);
                                                    Graylog.SendLogPushChange(`deviceTokenGroup of ${pemFileName} showPush ${showPush}:`, JSON.stringify(deviceTokenGroup));
                                                    AppleSilentPushChangeAPI.ApnSilentPush(
                                                        deviceTokenGroup,
                                                        pemName,
                                                        bundleId,
                                                        data,
                                                        Graylog,
                                                        showPush
                                                    );
                                                });
                                                // console.log(ApiLastModifiedOfUser);
                                                let maxApiLastModified = _.maxBy(ApiLastModifiedOfUser, (ApiLastModifiedOfUserWithOneRow) => {
                                                    return ApiLastModifiedOfUserWithOneRow.api_last_modified
                                                });
                                                Graylog.SendLogPushChange(`maxApiLastModified: ${maxApiLastModified.api_last_modified}`);
                                                // console.log(`pushChangesBatch: ${pushChangesBatch.map(({ id }) => id)}`);
                                                // Model.push_change.destroy({
                                                //     where: {
                                                //         id: {
                                                //             [Op.in]: pushChangesBatch.map(({ id }) => id)
                                                //         }
                                                //     }
                                                // });
                                                if (!_.isEmpty(maxApiLastModified) && !_.isNull(maxApiLastModified.api_last_modified)) {
                                                    Graylog.SendLogPushChange(`updating push_change: ${maxApiLastModified.api_last_modified}, now: ${now}`, maxApiLastModified.api_last_modified < now);
                                                    Model.push_change.update(
                                                    {
                                                        created_date: maxApiLastModified.api_last_modified
                                                    },
                                                    {
                                                        where: {
                                                            id: {
                                                                [Op.in]: [pushChangesBatch.find(({ user_id }) => user_id == userId).id]
                                                            }
                                                        }
                                                    });
                                                    // console.log('updated push_change');
                                                }
                                                // eslint-disable-next-line no-console
                                                // _.pull(users_running, userId);
                                                // console.log(users_running);
                                                // console.log('removed');
                                                // console.log('** Push Success', val);
                                            }
                                        });
                                    });
                                    Graylog.SendLogPushChange('Aws Push Change Notify', {
                                        data,
                                        devicePush,
                                        emailId: userId
                                    });
                                }
                            });
                        });
                    }
                    catch (e) {
                      console.error('caught', e);
                    }
                }
                // await pushChanges
                // console.log('abc', pushChanges);
            }
        });

        CronPushChange.start();
    } catch (error) {
        console.log(error);
    }
})();
