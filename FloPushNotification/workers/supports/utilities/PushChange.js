// const _ = require('lodash');
const Sequelize = require('sequelize');

const PushChange = {
    SaveData: async (Model, table, data, binlogTimestamp, Graylog) => {
        const userIdColumn = table === 'users' ? 'id' : 'user_id';
        const userId = data[0][userIdColumn];
        const ApiLastModified = data[0]['api_last_modified']
        const timeCreatePushChange = ApiLastModified - 0.001;
        // console.log(userId);
        // console.debug(data);
        const now = Date.now() / 1000;
        // const timestampModified = binlogTimestamp / 1000;

        const existed = await Model.push_change.findOne({
            where: {
                user_id: userId
            },
            raw: true
        });

        if (existed) {
            console.log('update, this case not execute');
        } else {
            console.log('created');
            console.log(ApiLastModified, timeCreatePushChange, now);
            await Model.push_change.create({
                user_id: userId,
                created_date: timeCreatePushChange
            });
            return;
        }
    },
    Remove: async (user_id, time, Model, Graylog) => {
        const Op = Sequelize.Op;

        pushChanges = await Model.push_change.findAll({
            where: {
                user_id: user_id,
                created_date: {
                    [Op.lte]: time
                }
            },
            raw: true
        });

        // console.log(pushChanges);
        return pushChanges;
    },
    // GetListTimeCompare: async (Model, timeCompare, Graylog) => {
    //     // const AsyncForEach = require('await-async-foreach');
    //     // const AwsConstant = require('../AwsConstant');
    //     // const AppleSilentPushChangeAPI = require('../../../projects/default/services/AppleSilentPushChangeAPI');

    //     const Op = Sequelize.Op;
    //     const now = Date.now() / 1000;
    //     console.log(`timeCompare: ${timeCompare}`);

    //     pushChanges = await Model.push_change.findAll({
    //         where: {
    //             created_date: {
    //                 [Op.lte]: timeCompare
    //             }
    //         }
    //     });

    //     // console.log(typeof pushChanges);
    //     return pushChanges;
    // },
    GetList: async (Model, timeCompare, Graylog) => {
        // const AsyncForEach = require('await-async-foreach');
        // const AwsConstant = require('../AwsConstant');
        // const AppleSilentPushChangeAPI = require('../../../projects/default/services/AppleSilentPushChangeAPI');

        const Op = Sequelize.Op;
        // console.log(`now: ${now}`);
        // console.log(`timeCompare: ${timeCompare}`);

        pushChanges = await Model.push_change.findAll({
            // where: {
            //     created_date: {
            //         [Op.lte]: timeCompare
            //     }
            // },
            order: Sequelize.col('created_date')
        });

        // console.log(typeof pushChanges);
        return pushChanges;

        // pushChanges = await Model.push_change.findAll({
        //     where: {
        //         created_date: {
        //             [Op.lte]: timeCompare
        //         }
        //     }
        // });
        // console.log(pushChanges);
        // await AsyncForEach(pushChanges, async (pushChange) => {
        //     console.log('hellolllll');
        //     const userId = pushChange.user_id;
        //     const createdDate = pushChange.created_date;
        //     // console.log(`--------1. data of user_id: ${pushChanges}----------`);

        //     let ApiLastModifiedOfUser = await Model.api_last_modified.findAll({
        //         where: {
        //             api_last_modified: {
        //                 [Op.gte]: createdDate
        //             }
        //         }
        //     });

        //     if(!_.isEmpty(ApiLastModifiedOfUser)) {
        //         console.log(`--------2. data of user_id: ${userId}----------`);
        //         let data = []
        //         _.each(ApiLastModifiedOfUser, (tableChange) => {
        //             console.debug(tableChange.api_name);
        //             data.push(tableChange.api_name);
        //         });
        //         console.log(data);
        //         const deviceToken = await Model.device_token.findAll({
        //             where: { user_id: userId},
        //             raw: true
        //         });
        //         const devicePush = {};
        //         if (deviceToken.length > 0) {
        //             const listDevices = {};
        //             deviceToken.map((i) => {
        //                 listDevices[`${i.device_type}${i.cert_env}`] = [];
        //                 return null;
        //             });
        //             deviceToken.map((i) => {
        //                 listDevices[`${i.device_type}${i.cert_env}`].push(i.device_token);
        //                 return null;
        //             });
        //             devicePush[`${userId}`] = listDevices;
        //         }
        //         console.log('** devicePush:', devicePush[userId]);
        //         await AsyncForEach(devicePush[userId], async (val, key) => {
        //             // emailInfo.setAccountId = j;
        //             console.log('** Push Success 1', val, key);
        //             _.forEach(AwsConstant.KEY_MAP_PUSH_NOTIFY, (x, y) => {
        //                 console.log('** Push Success 2', val[0], x, y);
        //                 if (val[0]) {
        //                     gmail = userId;
        //                     AppleSilentPushChangeAPI.ApnSilentPush(
        //                         'E123B15D46B74005CC388B80C46CF0A294C5DFB33464248078671F3EC2C37CB8',
        //                         y,
        //                         x,
        //                         Graylog
        //                     );
        //                     // eslint-disable-next-line no-console
        //                     console.log('** Push Success 3', val[0]);
        //                 }
        //             });
        //         });
        //         Graylog.SendLog('Aws Push Change Notify', {
        //             data,
        //             devicePush,
        //             emailId: userId
        //         });
        //     }
        // });
    }
};

module.exports = PushChange;
