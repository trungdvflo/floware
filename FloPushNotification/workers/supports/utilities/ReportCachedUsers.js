/* eslint-disable radix */
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');
const sequelize = require('sequelize');
const moment = require('moment');

const GetUserInfo = {
    AccessToken: (data) => {
        const listUser = [];
        data.map((key) => {
            listUser.push({
                userId: key.user_id,
                email: key.email
            });

            return null;
        });
        return listUser;
    },
    AppToken: (data) => {
        const listUser = [];
        data.map((key) => {
            listUser.push({
                userId: key.user_id,
                email: key.email
            });

            return null;
        });
        return listUser;
    },
    Cards: async (Model, table, data) => {
        const listAddress = data.map((item) => {
            return item.addressbookid;
        });
        const listPricipal = await Model.addressbooks.findAll({
            where: { id: listAddress },
            attributes: ['principaluri'],
            raw: true
        });
        const listEmail = listPricipal.map((item) => {
            const email = item.principaluri.replace('principals/', '');
            return email;
        });
        const listUserInfo = await Model.users.findAll({
            where: { email: listEmail },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },
    CalendarObjects: async (Model, table, data) => {
        const listCalendarId = data.map((item) => {
            return item.calendarid;
        });

        const listPricipal = await Model.calendarinstances.findAll({
            where: { calendarid: listCalendarId },
            attributes: ['principaluri'],
            raw: true
        });
        const listEmail = listPricipal.map((item) => {
            const principaluri = item.principaluri.toString();
            const email = principaluri.replace('principals/', '');
            return email;
        });
        const listUserInfo = await Model.users.findAll({
            where: { email: listEmail },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },
    Quota: async (Model, table, data) => {
        const listUsername = data.map((item) => {
            return item.username;
        });
        const listUserInfo = await Model.users.findAll({
            where: { email: listUsername },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },
    Files: async (Model, table, data) => {
        const listUserId = data.map((item) => {
            return item.user_id;
        });
        const listUserInfo = await Model.users.findAll({
            where: { id: listUserId },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },
    GroupsUsers: async (Model, table, data) => {
        const listUserId = data.map((item) => {
            return item.user_id;
        });
        const listUserInfo = await Model.users.findAll({
            where: { id: listUserId },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },
    Users: (data) => {
        const listUser = [];
        data.map((key) => {
            listUser.push({
                userId: key.id,
                email: key.username
            });

            return null;
        });
        return listUser;
    },
    SubscriptionPurchase: async (Model, table, data) => {
        const listUserId = data.map((item) => {
            return item.user_id;
        });
        const listUserInfo = await Model.users.findAll({
            where: { id: listUserId },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },
    UsersDeleted: async (Model, table, data) => {
        const listUserId = data.map((item) => {
            return item.user_id;
        });
        const listUserInfo = await Model.users.findAll({
            where: { id: listUserId },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    },

    SetAccounts: async (Model, table, data) => {
        const listUserId = data.map((item) => {
            return item.user_id;
        });
        const listUserInfo = await Model.users.findAll({
            where: { id: listUserId },
            attributes: [['id', 'userId'], 'email'],
            raw: true
        });
        return listUserInfo;
    }

};

const ReportCachedUsers = {

    CollectionData: async (Model, table, data, Graylog) => {
        const listUser = await ReportCachedUsers.GetListUserId(Model, table, data);
        const sizeCalendarObjects = await ReportCachedUsers.StorageCalendarObjects(Model, listUser);
        const sizeCards = await ReportCachedUsers.StorageCards(Model, listUser);
        const sizeQuota = await ReportCachedUsers.StorageQuota(Model, listUser);
        const StorageFiles = await ReportCachedUsers.StorageFiles(Model, listUser);
        const totalSize = [];

        await AsyncForEach(listUser, async (item) => {
            const sizeCalendarObject = _.get(sizeCalendarObjects, item.email, {});
            const eventsSize = Number(_.get(sizeCalendarObject, 'VEVENT', '0'));
            const todoSize = Number(_.get(sizeCalendarObject, 'VTODO', '0'));
            const journalSize = Number(_.get(sizeCalendarObject, 'VJOURNAL', '0'));

            const contact = parseInt(sizeCards[`${item.email}`].size);
            const quota = parseInt(sizeQuota[`${item.email}`].size);
            const note = parseInt(StorageFiles[`${item.email}`].size);
            const total = eventsSize + todoSize + journalSize + contact + quota + note;

            totalSize[`${item.email}`] = {
                message: quota,
                event: eventsSize,
                todo: todoSize,
                note: journalSize + note,
                contact,
                total
            };
        });

        await AsyncForEach(listUser, async (item) => {
            // Collect 3rdParty
            const account3rd = await Model.set_accounts.findAll({
                where: { user_id: item.userId },
                attributes: ['user_income', 'account_type'],
                order: [['id', 'DESC']],
                raw: true
            });
            const account3rdEmails = account3rd.map((i) => {
                return i.user_income;
            });
            const accountType = account3rd.map((i) => {
                return i.account_type;
            });

            // Collect Groups
            const listGroups = await Model.groups_users.findAll({
                where: { user_id: item.userId },
                attributes: ['group_id'],
                order: [['id', 'DESC']],
                raw: true
            });
            const listGroupsId = listGroups.map((i) => {
                return i.group_id;
            });
            const groupInfo = await Model.groups.findAll({
                where: { id: listGroupsId },
                attributes: ['id', 'name', 'group_type', 'description', 'created_date', 'updated_date'],
                order: [['id', 'DESC']],
                raw: true
            });
            const nameGroups = groupInfo.map((i) => {
                return i;
            });

            // Collect subscription_purchase
            let subscription = await Model.subscription_purchase.findOne({
                where: { user_id: item.userId, is_current: 1 },
                attributes: ['subID', 'created_date'],
                order: [['id', 'DESC']],
                raw: true
            });

            if (_.isNull(subscription) === true) {
                subscription = {
                    subID: 'ea0f0fa86f3320eac0a8155a4cc0b8e563dd',
                    created_date: 0
                };
            }
            let nextRenewal = 0;
            const subscriptionCreatedDate = _.get(subscription, 'created_date', 0);
            if (subscription.subID.indexOf('yearly') !== -1 && subscriptionCreatedDate > 0) {
                const dateString = moment.unix(subscriptionCreatedDate);
                const newDate = moment(dateString, 'DD-MM-YYYY hh:mm:ss.SSS').add(365, 'days');
                nextRenewal = moment(newDate).unix().valueOf();
            }
            if (subscription.subID.indexOf('monthly') !== -1 && subscriptionCreatedDate > 0) {
                const dateString = moment.unix(subscriptionCreatedDate);
                const newDate = moment(dateString, 'DD-MM-YYYY hh:mm:ss.SSS').add(30, 'days');
                nextRenewal = moment(newDate).unix().valueOf();
            }

            let subType = {
                subs_type: '',
                order_number: ''
            };
            if (_.isNull(subscription) === false) {
                subType = await Model.subscriptions.findOne({
                    where: { id: subscription.subID },
                    attributes: ['subs_type', 'order_number'],
                    order: [['id', 'DESC']],
                    raw: true
                });
            }

            // last_used_date of access token
            const lastUseAc = await Model.access_tokens.findOne({
                where: { user_id: item.userId },
                attributes: ['created_date'],
                order: [['id', 'DESC']],
                raw: true
            });
            const lastUseKeyApi = await Model.app_token.findOne({
                where: { user_id: item.userId },
                attributes: ['time_expire'],
                order: [['id', 'DESC']],
                raw: true
            });

            const createdAc = _.isNull(lastUseAc) ? 0 : lastUseAc.created_date;
            const createdKeyApi = _.isNull(lastUseKeyApi) ? 0 : lastUseKeyApi.time_expire;
            const lastUsedDate = createdAc > createdKeyApi ? createdAc : createdKeyApi;
            // Join date of users
            const userInfo = await Model.users.findOne({
                where: { id: item.userId },
                attributes: ['created_date', 'fullname', 'disabled'],
                raw: true
            });

            const deleteUserInfo = await Model.users_deleted.findOne({
                where: { user_id: item.userId },
                attributes: ['username', 'is_disabled', 'cleaning_date', 'progress'],
                raw: true
            });

            const additionInfo = _.pick(userInfo, ['fullname', 'disabled']);
            if (_.isEmpty(deleteUserInfo) === false) {
                additionInfo.userDeleted = deleteUserInfo;
            }
            const reportData = {
                user_id: item.userId,
                email: item.email,
                account_3rd: account3rd.length,
                account_3rd_emails: account3rd.length === 0 ? '' : JSON.stringify(account3rdEmails),
                account_type: accountType.length === 0 ? '' : JSON.stringify(accountType),
                storage: JSON.stringify(totalSize[`${item.email}`]),
                groups: nameGroups.length === 0 ? '' : JSON.stringify(nameGroups),
                sub_id: subscription.subID,
                subs_type: _.get(subType, 'subs_type', null),
                order_number: _.get(subType, 'order_number', null),
                subs_current_date: subscription.created_date,
                last_used_date: lastUsedDate,
                join_date: userInfo.created_date,
                next_renewal: nextRenewal,
                addition_info: JSON.stringify(additionInfo),
                disabled: _.get(userInfo, 'disabled', 0),
                deleted: _.isEmpty(deleteUserInfo) === false ? 1 : 0,
                updated_date: ReportCachedUsers.Timestamp()
            };

            const userInfoReport = await Model.report_cached_users.findOne({
                where: { user_id: item.userId },
                attributes: ['id'],
                raw: true
            });

            if (!_.isNull(userInfoReport)) {
                await Model.report_cached_users.update(reportData, {
                    where: {
                        id: userInfoReport.id
                    },
                    silent: true
                });
                console.log('Update report_user', reportData.email);
                reportData.user_id = '';
                reportData.account_3rd_emails = '';
                Graylog.SendLog(`Update report_user ${reportData.email} `, reportData);
            } else {
                reportData.created_date = ReportCachedUsers.Timestamp();
                await Model.report_cached_users.create(reportData);
                console.log('Create report_user', reportData.email);
                reportData.user_id = '';
                reportData.account_3rd_emails = '';
                Graylog.SendLog(`Update report_user ${reportData.email} `, reportData);
            }
        });
        return true;
    },
    GetListUserId: async (Model, table, data) => {
        let listUser = [];
        switch (table) {
            case 'access_tokens':
                listUser = GetUserInfo.AccessToken(data);
                break;
            case 'app_token':
                listUser = GetUserInfo.AccessToken(data);
                break;
            case 'cards':
                listUser = await GetUserInfo.Cards(Model, table, data);
                break;
            case 'calendarobjects':
                listUser = await GetUserInfo.CalendarObjects(Model, table, data);
                break;
            case 'quota':
                listUser = await GetUserInfo.Quota(Model, table, data);
                break;
            case 'files':
                listUser = await GetUserInfo.Files(Model, table, data);
                break;
            case 'groups_users':
                listUser = await GetUserInfo.GroupsUsers(Model, table, data);
                break;
            case 'users':
                listUser = await GetUserInfo.Users(data);
                break;
            case 'subscription_purchase':
                listUser = await GetUserInfo.SubscriptionPurchase(Model, table, data);
                break;
            case 'users_deleted':
                listUser = await GetUserInfo.UsersDeleted(Model, table, data);
                break;
            case 'set_accounts':
                listUser = await GetUserInfo.SetAccounts(Model, table, data);
                break;
            default:
                break;
        }
        return listUser;
    },
    StorageCalendarObjects: async (Model, listUser) => {
        const result = [];

        await AsyncForEach(listUser, async (item) => {
            const calendar = await Model.calendarinstances.findAll({
                where: { principaluri: `principals/${item.email}` },
                attributes: [['calendarid', 'id']],
                raw: true
            });

            const listID = calendar.map((i) => {
                return i.id;
            });

            const size = await Model.calendarobjects.findAll({
                where: { calendarid: listID },
                attributes: ['componenttype', [sequelize.fn('sum', sequelize.col('size')), 'size']],
                group: ['componenttype'],
                raw: true
            });

            result[item.email] = {};
            if (_.isEmpty(size) === false) {
                _.forEach(size, (sizeItem) => {
                    const componenttype = sizeItem.componenttype.toString();
                    result[item.email][componenttype] = sizeItem.size;
                });
            }
        });
        return result;
    },
    StorageCards: async (Model, listUser) => {
        const result = [];
        await AsyncForEach(listUser, async (item) => {
            const addressbooks = await Model.addressbooks.findAll({
                where: { principaluri: `principals/${item.email}` },
                attributes: ['id'],
                raw: true
            });
            const listID = addressbooks.map((i) => {
                return i.id;
            });

            const size = await Model.cards.findOne({
                where: { addressbookid: listID },
                attributes: [sequelize.fn('sum', sequelize.col('size'))],
                raw: true
            });
            result[item.email] = {
                size: size['sum(`size`)'] || 0
            };
        });
        // console.log('StorageCard ', result);
        return result;
    },
    StorageQuota: async (Model, listUser) => {
        const result = [];
        await AsyncForEach(listUser, async (item) => {
            const quota = await Model.quota.findOne({
                where: { username: item.email },
                attributes: ['bytes'],
                raw: true
            });

            result[item.email] = {
                size: _.get(quota, 'bytes', 0)
            };
        });
        // console.log('StorageQuota ', result);
        return result;
    },
    StorageFiles: async (Model, listUser) => {
        const result = [];
        await AsyncForEach(listUser, async (item) => {
            const files = await Model.files.findOne({
                where: { user_id: item.userId },
                attributes: [sequelize.fn('sum', sequelize.col('size'))],
                raw: true
            });
            result[item.email] = {
                size: files['sum(`size`)'] || 0
            };
        });
        // console.log('StorageFiles ', result);
        return result;
    },
    SumSize: (listSize) => {
        let size = {
            size: 0
        };
        if (listSize.length > 0) {
            size = listSize.reduce((previousValue, currentValue) => {
                return {
                    size: previousValue.size + currentValue.size
                };
            });
        }
        return size;
    },
    // format 1568269168.587
    Timestamp: (millisecond = Date.now()) => {
        try {
            if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
                return millisecond / 1000;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
};

module.exports = ReportCachedUsers;
