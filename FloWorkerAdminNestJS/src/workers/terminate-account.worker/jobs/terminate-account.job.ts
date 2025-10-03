import * as _ from 'lodash';
import { InitS3 } from '../../../configs/s3.config';
import { createMd5Digest } from '../../../commons/utils/common.util';

import { CardService } from '../../../commons/services/card.service';
import { AddressBooksService } from '../../../commons/services/address-books.service';
import { CalendarInstanceService } from '../../../commons/services/calendar-instance.service';
import { CalendarObjectService } from '../../../commons/services/calendar-object.service';
import { UserDeletedService } from '../../../commons/services/user-deleted.service';
import { UserService } from '../../../commons/services/user.service';

// Mail service
import { MailQuotaService } from '../../../commons/services/mail/quota.service';
import { DeviceTokenService as MailDeviceTokenService } from '../../../commons/services/mail/device-token.service';
import { MailUserService } from '../../../commons/services/mail/user.service';

import { AdminService } from '../services/admin.service';
import { AddressBookChangeService } from '../services/address-book-change.service';
import { CalendarChangeService } from '../services/calendar-change.service';
import { CalendarService } from '../services/calendar.service';
import { GmailAccessTokenService } from '../services/gmail-access-token.service';
import { GmailHistoryService } from '../services/gmail-history.service';
import { PrincipalService } from '../services/principal.service';
import { Graylog } from '../../../configs/graylog.config';
import { QueueName } from '../../../commons/constants/queues.contanst';
import { DELETED_DELAY, DEL_USER_PROGRESS, NUMBER_OF_BATCH, STEP_DELAY } from '../constant';
import { DeleteService } from '../services/delete.service';
import { SchedulingObjectService } from '../services/scheduling-object.service';
import { MailVirtualAliasService } from '../../../commons/services/mail/virtualAlias.service';

export class TerminateAccountJob {
  private readonly s3: InitS3;
  private readonly s3DAV: InitS3;
  private readonly AWS_S3_BUCKET_NAME: string;
  private readonly DAV_S3_BUCKET_NAME: string;
  private readonly deleteService = new DeleteService();
  private readonly adminService = new AdminService();
  private readonly addressBooksService = new AddressBooksService();
  private readonly addressBookChangeService = new AddressBookChangeService();
  private readonly cardService = new CardService();
  private readonly calendarInstanceService = new CalendarInstanceService();
  private readonly calendarChangeService = new CalendarChangeService();
  private readonly calendarObjectService = new CalendarObjectService();
  private readonly calendarService = new CalendarService();
  private readonly gmailAccessTokenService = new GmailAccessTokenService();
  private readonly gmailHistoryService = new GmailHistoryService();
  private readonly principalService = new PrincipalService();
  private readonly schedulingObjectService = new SchedulingObjectService();
  private readonly userService = new UserService();
  private readonly userDeletedService = new UserDeletedService();
  private readonly mailDeviceTokenService = new MailDeviceTokenService();
  private readonly mailQuotaService = new MailQuotaService();
  private readonly mailVirtualAliasService = new MailVirtualAliasService();
  private readonly mailUserService = new MailUserService();

  constructor() {
    this.AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET || 'bucket_name';
    this.DAV_S3_BUCKET_NAME = process.env.DAV_S3_BUCKET || 'bucket_name';

    this.s3 = new InitS3(this.AWS_S3_BUCKET_NAME, {
      endpoint: process.env.AWS_S3_ENDPOINT,
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
      }
    });

    this.s3DAV = new InitS3(this.DAV_S3_BUCKET_NAME, {
      endpoint: process.env.DAV_S3_ENDPOINT,
      region: process.env.DAV_S3_REGION,
      credentials: {
        accessKeyId: process.env.DAV_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.DAV_S3_SECRET_ACCESS_KEY
      }
    });
  }

  async S3MoveToDeleteFolder(source, email) {
    try {
      if (_.isEmpty(source) === true || _.isEmpty(email) === true) {
        return;
      }

      const deletedFolder = `userDeleted/${createMd5Digest(email)}/`;
      if (source.slice(-1) !== '/') {
        const copyStatus: any = await this.s3.Copy(source, `${deletedFolder}${source}`);
        if (copyStatus.code === 1) {
          await this.s3.Delete(source);
        } else {
          // Should be sentry
          Graylog.getInstance().SendLog({
            moduleName: QueueName.TERMINATE_ACCOUNT_QUEUE,
            message: `Terminate Account: Can not copy source ${source}`,
          });
        }

        return;
      }

      const { Contents }: any = await this.s3.ListFiles(source);
      if (!Contents?.length) return;
      // If only the root folder exists,it means all child folders and files are deleted
      // delete the root folder
      if (Contents.length === 1) {
        const copyStatus: any = await this.s3.Copy(
          Contents[0].Key,
          `${deletedFolder}${Contents[0].Key}`
        );
        if (copyStatus.code === 1) {
          await this.s3.Delete(Contents[0].Key);
        } else {
          // Should be sentry
          Graylog.getInstance().SendLog({
            moduleName: QueueName.TERMINATE_ACCOUNT_QUEUE,
            message: `Terminate Account: Can not copy source ${Contents[0].Key}`,
          });
        }

        return;
      }

      // Pull out the root folder,
      Contents.shift();
      const files = Contents.filter((item) => item.Key.slice(-1) !== '/');
      const folders = Contents.filter((item) => item.Key.slice(-1) === '/');
      if (files.length) {
        await Promise.all(files.map((file) => this.S3MoveToDeleteFolder(file.Key, email)));
      }
      if (folders.length) {
        await Promise.all(folders.map((folder) => this.S3MoveToDeleteFolder(folder.Key, email)));
      }
      // Recursive call this function until all files and folder are deleted
      await this.S3MoveToDeleteFolder(source, email);
    } catch (error) {
      // We catch here to make sure this step
      // not block any other steps
      // Should be sentry
      Graylog.getInstance().SendLog({
        moduleName: QueueName.TERMINATE_ACCOUNT_QUEUE,
        message: `ERROR: ${QueueName.TERMINATE_ACCOUNT_QUEUE}`,
        fullMessage: error.message,
      });
      throw error;
    }
  }

  async S3MoveToDeleteStaticFolder(source, email) {
    try {
      if (_.isEmpty(source) === true || _.isEmpty(email) === true) {
        return;
      }

      const deletedFolder = `userDeleted/${createMd5Digest(email)}/`;
      if (source.slice(-1) !== '/') {
        const copyStatus: any = await this.s3DAV.Copy(source, `${deletedFolder}${source}`);
        if (copyStatus.code === 1) {
          await this.s3DAV.Delete(source);
        } else {
          Graylog.getInstance().SendLog({
            moduleName: QueueName.TERMINATE_ACCOUNT_QUEUE,
            message: `Terminate Account: Can not copy source ${source}`,
          });
        }

        return;
      }
      const { Contents }: any = await this.s3DAV.ListFiles(source);
      if (!Contents.length) return;
      // If only the root folder exists,it means all child folders and files are deleted
      // delete the root folder
      if (Contents.length === 1) {
        const copyStatus: any = await this.s3DAV.Copy(
          Contents[0].Key,
          `${deletedFolder}${Contents[0].Key}`
        );
        if (copyStatus.code === 1) {
          await this.s3DAV.Delete(Contents[0].Key);
        } else {
          Graylog.getInstance().SendLog({
            moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
            message: `Terminate Account: Can not copy source ${Contents[0].Key}`,
          });
        }

        return;
      }

      // Pull out the root folder,
      Contents.shift();
      const files = Contents.filter((item) => item.Key.slice(-1) !== '/');
      const folders = Contents.filter((item) => item.Key.slice(-1) === '/');
      if (files.length) {
        await Promise.all(files.map((file) => this.S3MoveToDeleteStaticFolder(file.Key, email)));
      }
      if (folders.length) {
        await Promise.all(
          folders.map((folder) => this.S3MoveToDeleteStaticFolder(folder.Key, email))
        );
      }
      // Recursive call this function until all files and folder are deleted
      await this.S3MoveToDeleteStaticFolder(source, email);
    } catch (error) {
      // We catch here to make sure this step
      // not block any other steps
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE} SYNC DATA`,
        fullMessage: error.message,
      });
      throw error;
    }
  }

  async CleanDatabase(record) {
    try {
      // Promises can run concurrently
      const p1 = [];
      const p2 = [];
      const p3 = [];
      const p4 = [];
      const p5 = [];

      p1.push(this.deleteService.deleteByUserId(record.user_id, 'access_token'));
      p1.push(this.adminService.deleteByEmail(record.username));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'api_last_modified'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'cloud'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'contact_avatar'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'contact_history'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'deleted_item'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'device_token'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'email_group_user'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'email_tracking'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'metadata_email'));
      p1.push(this.deleteService.deleteByUserId(record.user_id, 'file'));
      //
      const addressBooks = await this.addressBooksService.findAllByPrincipal(
        `principals/${record.username}`,
        {
          fields: ['id']
        }
      );

      if (addressBooks.length > 0) {
        const addressbookIds = addressBooks.map((item) => item.id);
        p2.push(this.addressBookChangeService.deleteByAddressBookId(addressbookIds));
        p2.push(this.cardService.deleteByAddressBookId(addressbookIds));
        p2.push(this.addressBooksService.deleteById(addressbookIds));
      }
      //
      const calendarInstance = await this.calendarInstanceService.findAllByPrincipalUri(
        `principals/${record.username}`,
        { fields: ['calendarid'] }
      );
      if (calendarInstance.length > 0) {
        const calendarIds = calendarInstance.map((item) => item.calendarid);
        p2.push(this.calendarChangeService.deleteByCalendarId(calendarIds));
        p2.push(this.calendarObjectService.deleteByCalendarId(calendarIds));
        p2.push(this.calendarInstanceService.deleteByCalendarId(calendarIds));
        p2.push(this.calendarService.deleteById(calendarIds));
        //
        p2.push(this.calendarService.deleteByCalendarId(calendarIds, 'cal_todo'));
        p2.push(this.calendarService.deleteByCalendarId(calendarIds, 'cal_note'));
        p2.push(this.calendarService.deleteByCalendarId(calendarIds, 'cal_event'));
      }
      //
      p2.push(this.principalService.deleteByEmail(record.username));
      //
      p2.push(this.schedulingObjectService.deleteByUserId(`principals/${record.username}`));
      //
      const gmailAccesstokens = await this.gmailAccessTokenService.findByUserId(record.user_id, {
        fields: ['gmail']
      });

      if (gmailAccesstokens.length) {
        p2.push(
          this.gmailHistoryService.deleteByEmail(gmailAccesstokens.map((item) => item.gmail))
        );
        p2.push(this.gmailAccessTokenService.deleteByUserId(record.user_id));
      }
      //
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'group_user'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'identical_sender'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'kanban_card'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'kanban'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'linked_object'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'linked_collection_object'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'platform_setting'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'collection'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'collection_shared_member'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'collection_notification'));
      p3.push(this.deleteService.deleteByUserId(record.user_id, 'user_notification'));
      //
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'release_user'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'rule_filter_action'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'rule_filter_condition'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'rule'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'third_party_account'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'setting'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'sort_object'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'subscription_purchase'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'suggested_collection'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'trash_collection'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'url'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'user_platform_version'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'user_tracking_app'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'report_cached_user'));
      p4.push(this.deleteService.deleteByUserId(record.user_id, 'recent_object'));
      p4.push(this.deleteService.deleteByUsername(record.username, 'quota'));
      // for db email
      p5.push(this.mailDeviceTokenService.deleteByUserName(record.username));
      p5.push(this.mailQuotaService.deleteByUserName(record.username));
      p5.push(this.mailVirtualAliasService.deleteByUserName(record.username));
      p5.push(this.mailUserService.deleteByUserName(record.username));
      p5.push(this.userService.deleteById(record.user_id));

      await Promise.all(p1);
      await this.Delay(STEP_DELAY);
      await Promise.all(p2);
      await this.Delay(STEP_DELAY);
      await Promise.all(p3);
      await this.Delay(STEP_DELAY);
      await Promise.all(p4);
      await this.Delay(STEP_DELAY);
      await Promise.all(p5);
      await this.Delay(DELETED_DELAY);
    } catch (error) {
      // We catch here to make sure this step
      // not block any other steps
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE} SYNC DATA`,
        fullMessage: error.message,
      });
      throw error;
    }
  }

  Delay(delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(null);
      }, delay);
    });
  }

  async CleanUserData(cronStatus) {
    try {
      // list all users need to be deleted
      const deletedRecords = await this.userDeletedService.findAll4Delete({
        fields: ['user_id', 'username'],
        take: NUMBER_OF_BATCH
      });

      if (!deletedRecords || !deletedRecords.length) {
        cronStatus.isRunning = false;
        return;
      }

      for (const record of deletedRecords){
        await this.userDeletedService.updateProgressByUserId(
          record.user_id, DEL_USER_PROGRESS.doing_db);
        this.S3MoveToDeleteStaticFolder(
          `contact-avatar/${createMd5Digest(record.username)}/`,
          record.username
        );
        this.S3MoveToDeleteFolder(
          `${createMd5Digest(record.username)}/`,
          record.username);
        // clean Flo data
        await this.CleanDatabase(record);
        await this.userDeletedService.updateProgressByUserId(
          record.user_id, DEL_USER_PROGRESS.done_db);
      }
    } catch (error) {
      cronStatus.isRunning = false;
      // We catch here to make sure this step
      // not block any other steps
      Graylog.getInstance().SendLog({
        moduleName: QueueName.TERMINATE_ACCOUNT_QUEUE,
        message: `ERROR: ${QueueName.TERMINATE_ACCOUNT_QUEUE} SYNC DATA`,
        fullMessage: error.message,
      });
      throw error;
    }
  }
}
