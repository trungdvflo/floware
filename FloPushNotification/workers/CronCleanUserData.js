/* eslint-disable no-console */

const _ = require('lodash');
const { CronJob } = require('cron');
const { Op } = require('sequelize');
const MD5 = require('md5');
const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

const Delay = async (delay) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
};

const S3MoveToDeleteFolder = async (source, userId, S3, GrayLog) => {
    try {
        if (_.isEmpty(source) === true || _.isNumber(userId) === false) {
            return;
        }

        const deletedFolder = `userDeleted/${userId}/`;
        if (source.slice(-1) !== '/') {
            const copyStatus = await S3.Copy(source, `${deletedFolder}${source}`);
            if (copyStatus.code === 1) {
                await S3.Delete(source);
            } else {
                GrayLog.SendLog('CleanUserData', `Can not copy source ${source}`);
            }

            return;
        }
        const { Contents } = await S3.ListFiles(source);
        if (!Contents.length) return;
        // If only the root folder exists,it means all child folders and files are deleted
        // delete the root folder
        if (Contents.length === 1) {
            const copyStatus = await S3.Copy(Contents[0].Key, `${deletedFolder}${Contents[0].Key}`);
            if (copyStatus.code === 1) {
                await S3.Delete(Contents[0].Key);
            } else {
                GrayLog.SendLog('CleanUserData', `Can not copy source ${Contents[0].Key}`);
            }

            return;
        }

        // Pull out the root folder,
        Contents.shift();
        const files = Contents.filter(item => item.Key.slice(-1) !== '/');
        const folders = Contents.filter(item => item.Key.slice(-1) === '/');
        if (files.length) {
            await Promise.all(
                files.map(file => S3MoveToDeleteFolder(file.Key, userId))
            );
        }
        if (folders.length) {
            await Promise.all(
                folders.map(folder => S3MoveToDeleteFolder(folder.Key, userId))
            );
        }
        // Recursive call this function until all files and folder are deleted
        await S3MoveToDeleteFolder(source, userId);
    } catch (error) {
        // We catch here to make sure this step
        // not block any other steps        
        GrayLog.SendLog('CleanUserData', { error: error.stack || error.message || error });
    }
};

const S3MoveToDeleteStaticFolder = async (source, userId, S3DAV, GrayLog) => {
    try {
        if (_.isEmpty(source) === true || _.isNumber(userId) === false) {
            return;
        }

        const deletedFolder = `userDeleted/${userId}/`;
        if (source.slice(-1) !== '/') {
            const copyStatus = await S3DAV.Copy(source, `${deletedFolder}${source}`);
            if (copyStatus.code === 1) {
                await S3DAV.Delete(source);
            } else {
                GrayLog.SendLog('CleanUserData', `Can not copy source ${source}`);
            }

            return;
        }
        const { Contents } = await S3DAV.ListFiles(source);
        if (!Contents.length) return;
        // If only the root folder exists,it means all child folders and files are deleted
        // delete the root folder
        if (Contents.length === 1) {
            const copyStatus = await S3DAV.Copy(Contents[0].Key, `${deletedFolder}${Contents[0].Key}`);
            if (copyStatus.code === 1) {
                await S3DAV.Delete(Contents[0].Key);
            } else {
                GrayLog.SendLog('CleanUserData', `Can not copy source ${Contents[0].Key}`);
            }

            return;
        }

        // Pull out the root folder,
        Contents.shift();
        const files = Contents.filter(item => item.Key.slice(-1) !== '/');
        const folders = Contents.filter(item => item.Key.slice(-1) === '/');
        if (files.length) {
            await Promise.all(
                files.map(file => S3MoveToDeleteStaticFolder(file.Key, userId))
            );
        }
        if (folders.length) {
            await Promise.all(
                folders.map(folder => S3MoveToDeleteStaticFolder(folder.Key, userId))
            );
        }
        // Recursive call this function until all files and folder are deleted
        await S3MoveToDeleteStaticFolder(source, userId);
    } catch (error) {
        // We catch here to make sure this step
        // not block any other steps        
        GrayLog.SendLog('CleanUserData', { error: error.stack || error.message || error });
    }
};

const CleanDatabase = async (record, Model, GrayLog) => {
    try {
        if (_.isEmpty(record) === true || _.isNumber(record.user_id) === false) {
            return;
        }
        // Promises can run concurrently
        const p1 = [];
        // Promises can run concurrently
        // but after p1
        const p2 = [];
        // Promises can run concurrently
        // but after p2
        const p3 = [];
        // After p3
        const p4 = [];
        // After p4
        const p5 = [];

        p1.push(Model.access_tokens.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(Model.admin.destroy({
            where: { email: record.username }
        }));
        // 
        p1.push(Model.api_last_modified.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(Model.canvas_detail.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.cloud_storages.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(Model.contact_avatar.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(Model.deleted_items.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(Model.device_token.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(Model.email_groups_users.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.files.destroy({
            where: { user_id: record.user_id }
        }));

        const addressBooks = await Model.addressbooks.findAll({
            attributes: ['id'],
            where: {
                principaluri: `principals/${record.username}`
            }
        });

        if (addressBooks.length > 0) {
            const addressbookIds = addressBooks.map(item => item.id);
            p1.push(Model.addressbookchanges.destroy({
                where: { addressbookid: addressbookIds }
            }));
            p1.push(Model.cards.destroy({
                where: { addressbookid: addressbookIds }
            }));
            p2.push(Model.addressbooks.destroy({
                where: { id: addressbookIds }
            }));
        }

        const calendarInstance = await Model.calendarinstances.findAll({
            attributes: ['calendarid'],
            where: {
                principaluri: `principals/${record.username}`
            }
        });

        if (calendarInstance.length > 0) {
            const calendarIds = calendarInstance.map(item => item.calendarid);
            p1.push(Model.calendarchanges.destroy({
                where: { calendarid: calendarIds }
            }));

            p1.push(Model.calendarobjects.destroy({
                where: { calendarid: calendarIds }
            }));

            p1.push(Model.calendarinstances.destroy({
                where: { calendarid: calendarIds }
            }));

            p2.push(Model.calendars.destroy({
                where: { id: calendarIds }
            }));
        }

        const gmailAccesstokens = await Model.gmail_accesstokens.findAll({
            where: { user_id: record.user_id }
        });

        if (gmailAccesstokens.length) {
            p1.push(Model.gmail_historys.destroy({
                where: { gmail: gmailAccesstokens.map(item => item.gmail) }
            }));

            p2.push(Model.gmail_accesstokens.destroy({
                where: { user_id: record.user_id }
            }));
        }

        p1.push(Model.groups_users.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.history.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.identical_senders.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.kanbans.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.links.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.obj_order.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.platform_settings.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.principals.destroy({
            where: { email: record.username }
        }));
        // 
        p1.push(Model.projects.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(Model.quota.destroy({
            where: { username: record.username }
        }));
        // 
        p1.push(Model.recent_objects.destroy({
            where: { user_id: record.user_id }
        }));

        p1.push(Model.releases_users.destroy({
            where: { user_id: record.user_id }
        }));

        //
        p1.push(Model.rules_filter_actions.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.rules_filter_conditions.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p2.push(Model.rules.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.schedulingobjects.destroy({
            where: { principaluri: `principals/${record.username}` }
        }));
        //
        p1.push(Model.set_accounts.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.settings.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.sort_objects.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.subscription_purchase.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.suggested_collections.destroy({
            where: { user_id: record.user_id }
        }));
        //  TODO, base on manual-rule feature
        // p1.push(SyncEmailsStatusModel.destroy({ 
        //     where: { user_id: record.user_id }
        // }));
        //
        p1.push(Model.tracking.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.trash.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.urls.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.users_platform_versions.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.users_tracking_apps.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(Model.virtual_aliases.destroy({
            where: { source: record.username }
        }));

        //
        p4.push(Model.users.destroy({
            where: { id: record.user_id }
        }));
        //
        p5.push(Model.report_cached_users.destroy({
            where: { user_id: record.user_id }
        }));
        await Promise.all(p1);
        await Promise.all(p2);
        await Promise.all(p3);
        await Promise.all(p4);
        await Delay(1000);
        await Promise.all(p5);
    } catch (error) {
        // We catch here to make sure this step
        // not block any other steps
        GrayLog.SendLog('CleanUserData', { error: error.stack || error.message || error });
    }
};

const cronStatus = { isRunning: false };

(async () => {
    try {
        await AwsSystemParameterStore.Init();
        const Model = require('./supports/model');
        const GrayLog = require('./supports/utilities/GrayLog');
        const AppsConstant = require('./supports/AppConstant');
        const S3 = require('./supports/S3');
        const S3DAV = require('./supports/S3DAV');

        const cronTime = AppsConstant.CRON_TIME_CLEANING_DELETED_USER_DATA;
        const CleanUserData = new CronJob({
            cronTime,
            onTick: async () => {
                try {
                    const now = Date.now() / 1000;
                    // list all users need to be deleted
                    const deletedRecords = await Model.users_deleted.findAll({
                        where: {
                            cleaning_date: { [Op.lte]: now },
                            progress: [0, 1]
                        },
                        raw: true
                    });

                    if (!deletedRecords.length) {
                        cronStatus.isRunning = false;
                        return;
                    }

                    GrayLog.SendLog('CleanUserData', `Start cleaning users ${JSON.stringify(deletedRecords)}`);

                    const userIds = deletedRecords.map(item => item.user_id);
                    await Model.users_deleted.update(
                        { progress: 1 },
                        {
                            where: { user_id: userIds }
                        }
                    );

                    await Promise.all([
                        ...deletedRecords.map(record => S3MoveToDeleteStaticFolder(`contact-avatar/${MD5(record.username)}/`, record.user_id, S3DAV, GrayLog)),
                        ...deletedRecords.map(record => S3MoveToDeleteFolder(`${record.user_id}/`, record.user_id, S3, GrayLog)),
                        ...deletedRecords.map(record => CleanDatabase(record, Model, GrayLog))
                    ]);

                    await Model.users_deleted.update(
                        { progress: 2 },
                        {
                            where: { user_id: userIds }
                        }
                    );

                    GrayLog.SendLog('CleanUserData', `Finish cleaning users ${JSON.stringify(deletedRecords)}`);
                } catch (error) {
                    GrayLog.SendLog('CleanUserData', { error: error.stack || error.message || error });
                }
                cronStatus.isRunning = false;
            }
        });

        CleanUserData.start();
    } catch (error) {
        console.log(error);
    }
})();
