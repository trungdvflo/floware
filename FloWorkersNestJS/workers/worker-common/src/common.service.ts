import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import workerEnv from '../../common/configs/worker.config';
import { DELETED_ITEM_TYPE } from '../../common/constants/sort-object.constant';
import { IFileCommonJob, IFileCommonObjectJob, IFileJob, IWashabi } from '../../common/interface/file-attachment.interface';
import { IEmailObject } from '../../common/interface/subscription.interface';
import { DeviceTokenRepository } from '../../common/repository/api-last-modify.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { FileCommonRepository, ILinkedFileCommonPayload } from '../../common/repository/file-common.repository';
import { LinkedFileCommonRepository } from '../../common/repository/link-file-common.repository';
import { PushChangeRepository } from '../../common/repository/push-change.repository';
import { QuotaRepository } from '../../common/repository/quota.repository';
import { WasabiService } from '../../common/services/handle-washabi.service';
import { getTimestampDoubleByIndex, getUtcMillisecond } from '../../common/utils/common';
import { Graylog } from '../../common/utils/graylog';
import { MailUtils } from '../../common/utils/mail.util';
import { apnShutDown, apnSilentPushInit, pushMessage } from '../../common/utils/push-notification';
import { SubscriptionMailContent } from '../common/constants/subscription.template';
import { EMAIL_TEMPLATE } from '../common/constants/worker.constant';
@Injectable()
export class CommonService {
  private readonly mailUtils: MailUtils;
  constructor(
    private readonly configService: ConfigService,
    private readonly wasabiService: WasabiService,
    private readonly pushChangeRepo: PushChangeRepository,
    private readonly deviceTokenRepo: DeviceTokenRepository,
    private readonly fileCommonRepo: FileCommonRepository,
    private readonly linkedFileCommonRepo: LinkedFileCommonRepository,
    private readonly quotaRepo: QuotaRepository,
    private readonly deletedItemRepo: DeleteItemRepository
  ) {
    this.mailUtils = new MailUtils();
  }

  // Move code from old worker
  async pushChange(pushChangeTime: number, offset?: number, limit?: number) {
    const pemBundles = workerEnv().pemDevice;
    if (!pushChangeTime || !pemBundles) {
      return;
    }
    // Get data
    const [pushChanges, numRows] =
      await this.pushChangeRepo.getListPushChange(pushChangeTime, offset, limit);
    if (numRows === 0) return;

    const userIds: number[] = pushChanges.map((pushChange) => {
      return pushChange.user_id;
    });
    if (userIds.length === 0) return;

    const devices = await this.deviceTokenRepo.getListDeviceByUser(userIds);
    if (devices.length > 0) {
      const apnSilentPushInits = apnSilentPushInit(pemBundles);
      // push notify
      const pushNotification = [];
      const deviceTokens: string[] = [];
      devices.forEach((device) => {
        const provider = apnSilentPushInits[device.pem];
        if (provider) {
          deviceTokens.push(device.device_token);
          const bundle = pemBundles[device.pem];
          pushNotification.push(pushMessage(provider, bundle, device));
        }
      });

      const result = await Promise.all(pushNotification);
      // Shutdown APN Provider after push all device
      apnShutDown(Object.values(apnSilentPushInits));

      Graylog.getInstance().logInfo({
        moduleName: 'Push change lastmodify',
        message: 'Push change send deviceTokens',
      });
    }
    // clean up push change
    await this.pushChangeRepo.cleanPushChange(userIds);
    return this.finishPushNotification(pushChangeTime, numRows, offset, limit);
  }

  private finishPushNotification(pushChangeTime: number,
    numRows: number, offset: number, limit: number) {
    if (numRows > offset + limit) {
      return this.pushChange(pushChangeTime, offset + limit, limit);
    }
    return;
  }

  async sendEmailSubscription(mailObj: IEmailObject): Promise<void> {
    const { floLogo, floCopyright } = this.configService.get('worker');
    mailObj.logo_url = floLogo;
    mailObj.flo_copyright = `${floCopyright} ${new Date().getFullYear()}`;

    switch (mailObj.template) {
      case EMAIL_TEMPLATE.NEAR_EXPIRED:
        const htmlExpireContent = SubscriptionMailContent.nearExpired(mailObj);
        await this.mailUtils.Send({
          subject: mailObj.subject,
          to: mailObj.email,
          html: htmlExpireContent
        });
        break;
      case EMAIL_TEMPLATE.STORAGE_FULL:
        const htmlEmailContent = SubscriptionMailContent.storageFull(mailObj);
        await this.mailUtils.Send({
          subject: mailObj.subject,
          to: mailObj.email,
          html: htmlEmailContent
        });
        break;
      case EMAIL_TEMPLATE.STORAGE_NEAR:
        const htmlPercentContent = SubscriptionMailContent.storageNearFull(mailObj);
        await this.mailUtils.Send({
          subject: mailObj.subject,
          to: mailObj.email,
          html: htmlPercentContent
        });
        break;
      default:
        break;
    }
  }

  async deleteFileAttachment(data: IFileJob) {
    const fileItem: IWashabi = { uid: data.uid, ext: data.ext };
    await this.wasabiService.deleteOnWasabi(data.user_id, fileItem);
  }

  async deleteFileCommonsAttachment(data: IFileCommonJob) {
    const allFiles = await this.fileCommonRepo
      .getAllFiles(data);
    const currentDate = getUtcMillisecond();

    await Promise.all(allFiles.map(async (link, idx) => {
      link.collection_id = data.collection_id;
      const dateItem = getTimestampDoubleByIndex(currentDate, idx);
      await this.deleteFileCommonSingle(link, dateItem);
    }));
  }

  async deleteFileCommonsofObject(data: IFileCommonObjectJob) {
    try {
      const allFiles = await this.fileCommonRepo
        .getFilesCommentOfObject(data);
      const currentDate = getUtcMillisecond();
      await Promise.all(allFiles.map(async (link, idx) => {
        const dateItem = getTimestampDoubleByIndex(currentDate, idx);
        await this.deleteFileCommonSingle(link, dateItem);
      }));
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'trash worker',
        message: 'delete file comment when delete trash',
        fullMessage: error
      });
      return error;
    }
  }

  async deleteFileCommonSingle(link: ILinkedFileCommonPayload, dateItem: number) {
    // 1. delete   file commons
    await this.fileCommonRepo.delete({
      id: link.fileId,
      user_id: link.userId
    });
    // 2. generate deleted item for collection
    await this.deletedItemRepo.generateDeletedItemForSharedCollection({
      itemType: DELETED_ITEM_TYPE.COMMENT_ATTACHMENT
      , collectionId: link.collection_id
      , itemId: link.fileId
      , deleteDate: dateItem
    });

    // 3. delete linked file commons
    await this.linkedFileCommonRepo.delete({
      id: link.linkId,
      user_id: link.userId
    });
    const fileItem: IWashabi = { uid: link.uid, ext: link.ext };
    // 4. update storage
    await this.quotaRepo.changeQuotaFileCommonByUserId(-link.size, link.userId);
    // 5. remove wasabi
    await this.wasabiService.deleteOnWasabi(link.userId, fileItem);
  }
}