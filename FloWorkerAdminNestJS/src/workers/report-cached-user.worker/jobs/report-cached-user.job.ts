import * as _ from 'lodash';
import moment from 'moment-timezone';

import { ReportCachedUserService } from '../../../commons/services/report-cached-user.service';
import { CalendarObjectService } from '../../../commons/services/calendar-object.service';
import { UserService } from '../../../commons/services/user.service';
import { ThirdPartyAccounService } from '../../../commons/services/third-party-account.service';
import { AddressBooksService } from '../../../commons/services/address-books.service';
import { CardService } from '../../../commons/services/card.service';
import { FileService } from '../../../commons/services/file.service';
import { GroupUserService } from '../../../commons/services/group-user.service';
import { SubscriptionPurchaseService } from '../../../commons/services/subscription-purchase.service';
import { AccessTokenService } from '../../../commons/services/access-token.service';
import { UserDeletedService } from '../../../commons/services/user-deleted.service';
import { TrackingAppService } from '../../../commons/services/tracking-app.service';
// Mail service
import { MailQuotaService } from '../../../commons/services/mail/quota.service';
import { SubscriptionService } from '../services/subscription.service';
import { AppTokenService } from '../services/app-token.service';
import { GroupService } from '../services/group.service';
import { Graylog } from '../../../configs/graylog.config';
import { QueueName } from '../../../commons/constants/queues.contanst';
import { AddressBooks } from '../../../commons/entities/address-books.entity';
import { SUB_TYPE } from '../../../commons/constants/constant';

export class ReportCachedUserJob {
  private readonly reportCachedUserService = new ReportCachedUserService();
  private readonly calendarObjectService = new CalendarObjectService();
  private readonly userService = new UserService();
  private readonly addressBooksService = new AddressBooksService();
  private readonly cardService = new CardService();
  private readonly quotaService = new MailQuotaService();
  private readonly fileService = new FileService();
  private readonly thirdPartyAccountService = new ThirdPartyAccounService();
  private readonly groupUserService = new GroupUserService();
  private readonly subscriptionPurchaseService = new SubscriptionPurchaseService();
  private readonly userDeletedService = new UserDeletedService();
  private readonly accessTokenService = new AccessTokenService();
  private readonly groupService = new GroupService();
  private readonly appTokenService = new AppTokenService();
  private readonly subscriptionService = new SubscriptionService();
  private readonly trackingAppService = new TrackingAppService();
  async queueHandle({ userId, email }: { userId?: number; email?: string }) {
    try {
      let user;
      if (userId) {
        user = await this.userService.getUserById(userId, {
          fields: ['id', 'email', 'created_date', 'fullname', 'disabled']
        });
      }

      if (!user?.id && email) {
        user = await this.userService.getUserByEmail(email, {
          fields: ['id', 'email', 'created_date', 'fullname', 'disabled']
        });
      }
      if (user === null) return;

      const sizeCards = await this.StorageCards(user);
      const sizeQuota = await this.StorageQuota(user);
      const sizeFile = await this.StorageFiles(user);

      const caldavSize = await this.calendarObjectService.callCaldavSize(`principals/${user.email}`);
      const eventsSize = +caldavSize.VEVENT || 0;
      const todoSize = +caldavSize.VTODO || 0;
      const journalSize = +caldavSize.VJOURNAL || 0;

      const totalSize = [];
      const contact = parseInt(sizeCards[`${user.email}`].size, 10);
      const quota = parseInt(sizeQuota[`${user.email}`].size, 10);
      const note = parseInt(sizeFile[`${user.email}`].size, 10);
      const total = eventsSize + todoSize + journalSize + contact + quota + note;

      totalSize[`${user.email}`] = {
        message: quota,
        event: eventsSize,
        todo: todoSize,
        note: journalSize + note,
        contact,
        total
      };
      // update size to quota
      await this.quotaService.updateQuota(email, {
        cal_bytes: eventsSize + todoSize + journalSize,
        card_bytes: contact,
        file_bytes: note
      })
      // Collect 3rdParty
      const account3rd = await this.thirdPartyAccountService.findAllById(user.id, {
        fields: ['user_income', 'account_type']
      });
      const account3rdEmails = account3rd.map((i) => i.user_income);
      const accountType = account3rd.map((i) => i.account_type);

      // Collect Groups
      // const listGroups = await this.groupUserService.findAllByUserId(user.id, {
      //   fields: ['group_id']
      // });
      // const listGroupsId = listGroups.map((i) => i.group_id);
      // const groupInfo = await this.groupService.findAllByGroupIdList(listGroupsId, {
      //   fields: ['id', 'name', 'group_type', 'description', 'created_date', 'updated_date']
      // });
      // const nameGroups = groupInfo.map((i) => i);
      const nameGroups = await this.groupUserService.getAllGroupsByUserId(user.id);

      const { subscription, nextRenewal, subType } = await this.getNextRenewalDate(user);

      // 1. last_used_date of access token
      const lastUseAc = await this.accessTokenService.findOneByUserId(user.id, {
        fields: ['created_date']
      });
      const lastUsedDate: number = _.get(lastUseAc, 'created_date', 0);
      // Join date of users
      const deleteUserInfo = await this.userDeletedService.findOneByUserId(user.id, {
        fields: ['username', 'is_disabled', 'cleaning_date', 'progress']
      });

      const additionInfo = _.pick(user, ['fullname', 'disabled']);
      if (_.isEmpty(deleteUserInfo) === false) {
        additionInfo.userDeleted = deleteUserInfo;
      }
      const platform = await this.userService.getAllPlatform(user.id);
      const reportData = {
        user_id: user.id,
        email: user.email,
        account_3rd: account3rd.length,
        account_3rd_emails: account3rd.length === 0 ? '' : JSON.stringify(account3rdEmails),
        account_type: accountType.length === 0 ? '' : JSON.stringify(accountType),
        storage: JSON.stringify(totalSize[`${user.email}`]),
        storage_total: total,
        groups: nameGroups.length === 0 ? '[]' : JSON.stringify(nameGroups),
        sub_id: subscription.sub_id,
        subs_type: _.get(subType, 'subs_type', null),
        order_number: _.get(subType, 'order_number', null),
        subs_current_date: subscription.created_date,
        last_used_date: lastUsedDate,
        join_date: user.created_date,
        next_renewal: nextRenewal,
        addition_info: JSON.stringify(additionInfo),
        platform: !platform ? []
          : platform.map(p => ({ ...p, api_version: '4.0' })),
        disabled: user.disabled,
        deleted: _.isEmpty(deleteUserInfo) === false ? 1 : 0
      };

      await this.reportCachedUserService.upsert(reportData);
    } catch (error) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE}`,
        fullMessage: error.message
      });
      throw error;
    }
  }
  /**
 * special case: change to Monthly on December
 * @param {*} expiredDate 
 * @returns 
 */
  isYearly(subType) {
    const subs_type = _.get(subType, 'subs_type', null);
    return subs_type === SUB_TYPE.YEARLY;
  }

  async StorageCards(user: any) {
    const result = [];
    const addressBooks: AddressBooks[] = await this.addressBooksService.findAllByPrincipal(
      `principals/${user.email}`,
      {
        fields: ['id']
      }
    );

    const addressBookIds = addressBooks.map((i) => i.id);
    result[user.email] = await this.cardService.calcSizeContact(addressBookIds);
    return result;
  }

  async getNextRenewalDate(user) {
    // Collect subscription_purchase
    let subscription: any = await this.subscriptionPurchaseService.findOneByUserId(user.id, 1, {
      fields: ['sub_id', 'created_date']
    });
    let nextRenewal = 0;

    if (_.isEmpty(subscription)) {
      subscription = { sub_id: 'ea0f0fa86f3320eac0a8155a4cc0b8e563dd', created_date: 0 }
    }
    const subType = await this.subscriptionService.findOneById(subscription.sub_id, {
        fields: ['subs_type', 'order_number']
      });
    const subscribeDate = _.get(subscription, 'created_date', 0) * 1e3;
    nextRenewal = this.isYearly(subType)
      ? new Date(subscribeDate).setUTCFullYear(new Date(subscribeDate).getUTCFullYear() + 1) / 1e3
      : new Date(subscribeDate).setUTCMonth(new Date(subscribeDate).getUTCMonth() + 1) / 1e3;

    return { nextRenewal, subscription, subType };
  }

  async StorageQuota(user: any) {
    const result = [];
    const quota = await this.quotaService.findOneByEmail(user.email, { fields: ['bytes', 'qa_bytes', 'file_common_bytes'] });
    result[user.email] = { size: _.get(quota, 'bytes', 0) + _.get(quota, 'qa_bytes', 0) + _.get(quota, 'file_common_bytes', 0) };
    return result;
  }

  async StorageFiles(user: any) {
    const result = [];
    const files = await this.fileService.findSumByUserId(user.id);
    result[user.email] = { size: files?.size || 0 };
    return result;
  }

  async syncData() {
    const users = await this.userService.getUsersJoinReport();
    if (users.length) {
      await this.job(users, 0);
    }
  }

  async job(users, index) {
    try {
      await this.queueHandle({ userId: users[index].id });
      await this.job(users, ++index);
    } catch (err) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE}`,
        fullMessage: err.message
      });
      throw err;
    }
  }
}
