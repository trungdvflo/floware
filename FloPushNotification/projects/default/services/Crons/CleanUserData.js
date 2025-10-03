const { CronJob } = require('cron');
const { Op } = require('sequelize');
const _ = require('lodash');
const MD5 = require('md5');

const S3 = require('../../../../workers/supports/S3');
const S3DAV = require('../../../../workers/supports/S3DAV');
const GrayLog = require('../../../../workers/supports/utilities/GrayLog');
const AppsConstant = require('../../constants/AppsConstant');

const Delay = async (delay) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
};

const {
    UsersDeletedModel, AccessTokensModel, CalendarModel, CalendarinstanceModel,
    AddressbookModel, AddressbookChangeModel, AdminModel,
    ApiLastModifiedModel, CalendarChangesModel, CalendarObjectsModel,
    CanvasDetailModel, CardsModel, CloudStoragesModel,
    ContactAvatarModel, DeletedItemsModel, DeviceTokenModel,
    EmailGroupUsersModel, FilesModel, GmailAccesstokensModel,
    GmailHistorysModel, GroupUserModel, HistoryModel,
    IdenticalSendersModel, KanbansModel, LinksModel,
    ObjOrderModel, PlatformSettingsModel, PrincipalModel,
    ProjectsModel, QuotaModel, RecentObjectsModel,
    ReleaseUserModel, ReportCachedUserModel, RulesFilterActionsModel, RulesFilterConditionsModel,
    RulesModel, SchedulingObjectsModel, SetAccountsModel,
    SettingModel, SortObjectsModel, SubscriptionPurchaseModel,
    SuggestedCollectionsModel, TrackingModel,
    TrashModel, UrlModel, UsersPlatformVersionsModel,
    UsersTrackingAppsModel, VirtualAliasModel, UsersModel
} = require('../../models/Sequelize');

const S3MoveToDeleteFolder = async (source, userId) => {
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

const S3MoveToDeleteStaticFolder = async (source, userId) => {
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

const CleanDatabase = async (record) => {
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

        p1.push(AccessTokensModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(AdminModel.destroy({
            where: { email: record.username }
        }));
        // 
        p1.push(ApiLastModifiedModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(CanvasDetailModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(CloudStoragesModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(ContactAvatarModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(DeletedItemsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(DeviceTokenModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  
        p1.push(EmailGroupUsersModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(FilesModel.destroy({
            where: { user_id: record.user_id }
        }));

        const addressBooks = await AddressbookModel.findAll({
            attributes: ['id'],
            where: {
                principaluri: `principals/${record.username}`
            }
        });

        if (addressBooks.length > 0) {
            const addressbookIds = addressBooks.map(item => item.id);
            p1.push(AddressbookChangeModel.destroy({
                where: { addressbookid: addressbookIds }
            }));
            p1.push(CardsModel.destroy({
                where: { addressbookid: addressbookIds }
            }));
            p2.push(AddressbookModel.destroy({
                where: { id: addressbookIds }
            }));
        }

        const calendarInstance = await CalendarinstanceModel.findAll({
            attributes: ['calendarid'],
            where: {
                principaluri: `principals/${record.username}`
            }
        });

        if (calendarInstance.length > 0) {
            const calendarIds = calendarInstance.map(item => item.calendarid);
            p1.push(CalendarChangesModel.destroy({
                where: { calendarid: calendarIds }
            }));

            p1.push(CalendarObjectsModel.destroy({
                where: { calendarid: calendarIds }
            }));

            p1.push(CalendarinstanceModel.destroy({
                where: { calendarid: calendarIds }
            }));

            p2.push(CalendarModel.destroy({
                where: { id: calendarIds }
            }));
        }

        const gmailAccesstokens = await GmailAccesstokensModel.findAll({
            where: { user_id: record.user_id }
        });

        if (gmailAccesstokens.length) {
            p1.push(GmailHistorysModel.destroy({
                where: { gmail: gmailAccesstokens.map(item => item.gmail) }
            }));

            p2.push(GmailAccesstokensModel.destroy({
                where: { user_id: record.user_id }
            }));
        }

        p1.push(GroupUserModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(HistoryModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(IdenticalSendersModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(KanbansModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(LinksModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(ObjOrderModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(PlatformSettingsModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(PrincipalModel.destroy({
            where: { email: record.username }
        }));
        // 
        p1.push(ProjectsModel.destroy({
            where: { user_id: record.user_id }
        }));
        // 
        p1.push(QuotaModel.destroy({
            where: { username: record.username }
        }));
        // 
        p1.push(RecentObjectsModel.destroy({
            where: { user_id: record.user_id }
        }));

        p1.push(ReleaseUserModel.destroy({
            where: { user_id: record.user_id }
        }));

        //
        p1.push(RulesFilterActionsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(RulesFilterConditionsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p2.push(RulesModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(SchedulingObjectsModel.destroy({
            where: { principaluri: `principals/${record.username}` }
        }));
        //
        p1.push(SetAccountsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(SettingModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(SortObjectsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(SubscriptionPurchaseModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(SuggestedCollectionsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //  TODO, base on manual-rule feature
        // p1.push(SyncEmailsStatusModel.destroy({ 
        //     where: { user_id: record.user_id }
        // }));
        //
        p1.push(TrackingModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(TrashModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(UrlModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(UsersPlatformVersionsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(UsersTrackingAppsModel.destroy({
            where: { user_id: record.user_id }
        }));
        //
        p1.push(VirtualAliasModel.destroy({
            where: { source: record.username }
        }));

        //
        p4.push(UsersModel.destroy({
            where: { id: record.user_id }
        }));
        //
        p5.push(ReportCachedUserModel.destroy({
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
/**
 *
 */
const cronStatus = { isRunning: false };

/**
 *
 */
const CleanUserData = new CronJob({
    cronTime: AppsConstant.CRON_TIME_CLEANING_DELETED_USER_DATA,
    onTick: async () => {
        if (cronStatus.isRunning) return;
        cronStatus.isRunning = true;
        GrayLog.SendLog('CleanUserData', 'Start');
        try {
            const now = Date.now() / 1000;
            // list all users need to be deleted
            const deletedRecords = await UsersDeletedModel.findAll({
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
            await UsersDeletedModel.update(
                { progress: 1 },
                {
                    where: { user_id: userIds }
                }
            );

            await Promise.all([
                ...deletedRecords.map(record => S3MoveToDeleteStaticFolder(`contact-avatar/${MD5(record.username)}/`, record.user_id)),
                ...deletedRecords.map(record => S3MoveToDeleteFolder(`${record.user_id}/`, record.user_id)),
                ...deletedRecords.map(record => CleanDatabase(record))
            ]);

            await UsersDeletedModel.update(
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

GrayLog.SendLog('CleanUserData', '[**] Start Crons: Clean user data');

module.exports = CleanUserData;
