import { Injectable } from '@nestjs/common';
import { Notification, Provider } from '@parse/node-apn';
import { Json } from 'aws-sdk/clients/marketplacecatalog';
import {
  CALL_NOTIFICATION,
  CERT_ENV,
  DEVICE_TOKEN_TYPE,
  DEVICE_TYPE,
  ENV_SILENT
} from '../../common/constants';
import { LoggerService } from '../../common/logger/logger.service';
import cfAPNs from '../../configs/apns';
import { DeviceTokenRepository } from '../../database/repositories';
import {
  APNS_CATEGORY,
  IMessageAPNs,
  IMessageHeader,
  Type,
} from '../../interface/message.interface';
import { IMessageProvider } from '../../interface/message.provider.interface';

export type APNsData = {
  title?: string;
  body?: string;
  metadata: any;
  ignore_devices?: string[];
};

export enum APS_DEFAUlT {
  priority = 'high',
  sound = 'default',
}

export enum CONTENT_AVAILABLE {
  ALERT = 0,
  SILENT = 1,
}

interface DeviceToken {
  username: string;
  device_type: DEVICE_TYPE;
  device_uid: string;
  device_token: string;
  user_id: number;
  cert_env: CERT_ENV;
  env_silent: ENV_SILENT;

  app_id: string;
  app_version: string;
  flo_version: string;
  build_number: number;
}

interface APNsPayload {
  metadata: any;
  deviceTokens: DeviceTokenList;
  voip: boolean;
  category: APNS_CATEGORY;
}

interface DeviceTokenList {
  [key: string]: DeviceToken[];
}

@Injectable()
export class APNsProvider implements IMessageProvider {
  private readonly apnKeyPath: string;
  private readonly apnKeyVoipIPad: Json;
  private readonly apnKeyMapIPad: Json;
  private readonly apnKeyVoipIPhone: Json;
  private readonly apnKeyMapIPhone: Json;
  private readonly apnKeyMapMacOS: Json;
  constructor(private readonly deviceTokenRepo: DeviceTokenRepository) {
    this.apnKeyPath = cfAPNs().apnKeyPath;
    this.apnKeyVoipIPad = cfAPNs().apnKeyVoipIPad ? JSON.parse(cfAPNs().apnKeyVoipIPad) : {};
    this.apnKeyMapIPad = cfAPNs().apnKeyMapIPad ? JSON.parse(cfAPNs().apnKeyMapIPad) : {};
    this.apnKeyVoipIPhone = cfAPNs().apnKeyVoipIPhone ? JSON.parse(cfAPNs().apnKeyVoipIPhone) : {};
    this.apnKeyMapIPhone = cfAPNs().apnKeyMapIPhone ? JSON.parse(cfAPNs().apnKeyMapIPhone) : {};
    this.apnKeyMapMacOS = cfAPNs().apnKeyMapMacOS ? JSON.parse(cfAPNs().apnKeyMapMacOS) : {};
  }

  async send(to: string[], message: IMessageAPNs): Promise<any> {
    try {
      if (!to?.length) {
        return false;
      }
      to.filter((email) =>
        message.isNotSendSelf()
          ? email !== message.header?.from
          : true
      ).forEach(async (email) => {
        // 1. find out token
        const deviceTokens: DeviceTokenList = await this.getDeviceTokens(
          email || '',
          message.isVoIP()
        );
        if (!Object.keys(deviceTokens).length) {
          return;
        } else {
          for (const key in deviceTokens) {
            if(deviceTokens.hasOwnProperty(key)) {
              deviceTokens[key] = deviceTokens[key].filter(
                ({ device_token }) =>
                  !message.ignore_device_tokens ||
                  !message.ignore_device_tokens.includes(device_token)
              );
            }
          }
        }

        const payload: APNsPayload = {
          metadata: {
            ...message.payload?.metadata,
            message_code: message.payload.message_code,
            ignore_devices: message.ignore_devices || [],
            email: message.header.from,
            body: message.payload.content,
          },
          deviceTokens,
          voip: message.isVoIP(),
          category: message.getAPNsCategory(),
        };

        // 2. Send to IPAD
        const { iPadPassed, iPadFailed } = await this.sendIPad(payload, message.header);

        // 3. Send to Iphone
        const { iPhonePassed, iPhoneFailed } = await this.sendIPhone(payload, message.header);

        // 4. Send to Mac
        const { macOSPassed, macOSFailed } = await this.sendMacOS(payload, message.header);

        LoggerService.getInstance().logInfo(
          'SendAPNs result:' +
          JSON.stringify({
            passed: { iPadPassed, iPhonePassed, macOSPassed },
            failed: { iPadFailed, iPhoneFailed, macOSFailed },
          })
        );
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendIPad(
    { metadata, deviceTokens, voip, category }: APNsPayload,
    header: IMessageHeader
  ) {
    const iPadPassed: string[] = [];
    const iPadFailed: string[] = [];
    const ipadTokens: DeviceToken[] = deviceTokens[DEVICE_TOKEN_TYPE.FLO_IPAD];

    if (!ipadTokens?.length) {
      return { iPadPassed, iPadFailed };
    }
    const keyMap = voip ? this.apnKeyVoipIPad : this.apnKeyMapIPad;
    await Promise.all(
      Object.entries(keyMap).map(async ([key, bundleId]) => {
        const sendSuccess = await this.sendAPNs(
          { metadata },
          ipadTokens,
          key,
          `${bundleId}`,
          header.event_type === Type.NOTIFICATION,
          this.apnKeyPath,
          category,
          DEVICE_TOKEN_TYPE.FLO_IPAD
        );
        if (sendSuccess) {
          iPadPassed.push(...this.detachDeviceToken(ipadTokens));
        } else {
          iPadFailed.push(...this.detachDeviceToken(ipadTokens));
        }
      })
    );

    return {
      iPadPassed: [...new Set(iPadPassed)].map((device_token) => ({ device_token })),
      iPadFailed,
    };
  }

  private async sendIPhone(
    { metadata, deviceTokens, voip, category }: APNsPayload,
    header: IMessageHeader
  ) {
    const iPhonePassed: string[] = [];
    const iPhoneFailed: string[] = [];
    const iPhoneTokens: DeviceToken[] = deviceTokens[DEVICE_TOKEN_TYPE.FLO_IPHONE];
    if (!iPhoneTokens?.length) {
      return { iPhonePassed, iPhoneFailed };
    }

    const keyMap = voip ? this.apnKeyVoipIPhone : this.apnKeyMapIPhone;

    await Promise.all(
      Object.entries(keyMap).map(async ([key, bundleId]) => {
        const sendSuccess = await this.sendAPNs(
          { metadata },
          iPhoneTokens,
          key,
          `${bundleId}`,
          header.event_type === Type.NOTIFICATION,
          this.apnKeyPath,
          category,
          DEVICE_TOKEN_TYPE.FLO_IPHONE
        );
        if (sendSuccess) {
          iPhonePassed.push(...this.detachDeviceToken(iPhoneTokens));
        } else {
          iPhoneFailed.push(...this.detachDeviceToken(iPhoneTokens));
        }
      })
    );
    return {
      iPhonePassed: [...new Set(iPhonePassed)].map((device_token) => ({ device_token })),
      iPhoneFailed,
    };
  }

  private async sendMacOS(
    { metadata, deviceTokens, voip, category }: APNsPayload,
    header: IMessageHeader
  ) {
    const macOSPassed: string[] = [];
    const macOSFailed: string[] = [];
    const macOSTokens: DeviceToken[] = deviceTokens[DEVICE_TOKEN_TYPE.FLO_MAC];

    if (!macOSTokens?.length) {
      return { macOSPassed, macOSFailed };
    }
    await Promise.all(
      Object.entries(this.apnKeyMapMacOS).map(async ([key, bundleId]) => {
        const sendSuccess = await this.sendAPNs(
          { metadata },
          macOSTokens,
          key,
          `${bundleId}`,
          // ONLY Alert when send call
          voip || header.event_type === Type.NOTIFICATION,
          this.apnKeyPath,
          category,
          DEVICE_TOKEN_TYPE.FLO_MAC
        );
        if (sendSuccess) {
          macOSPassed.push(...this.detachDeviceToken(macOSTokens));
        } else {
          macOSFailed.push(...this.detachDeviceToken(macOSTokens));
        }
      })
    );
    return {
      macOSPassed: [...new Set(macOSPassed)].map((device_token) => ({ device_token })),
      macOSFailed,
    };
  }

  /**
   * get add invitee's access token
   * @param invitee
   * @param deviType
   * @returns
   */
  private async getDeviceTokens(email: string, voip: boolean): Promise<DeviceTokenList> {
    if (!email?.length) return null;
    const allDeviceToken = await this.deviceTokenRepo.listOfDeviceToken(email, voip);
    return this.filterDevicesByType(allDeviceToken);
  }
  /**
   * Filter all device by platform don't matter sandbox or not
   * @param devices
   * @returns
   */
  private filterDevicesByType(devices: any[]): DeviceTokenList {
    return devices.reduce((filtered, device) => {
      const key = (() => {
        switch (device.device_type) {
          //
          case DEVICE_TYPE.FLO_IPAD_QC:
          case DEVICE_TYPE.FLO_IPAD_PROD:
            return DEVICE_TOKEN_TYPE.FLO_IPAD;
          //
          case DEVICE_TYPE.FLO_IPHONE_QC:
          case DEVICE_TYPE.FLO_INTERNAL:
          case DEVICE_TYPE.FLO_IPHONE_DEV:
            return DEVICE_TOKEN_TYPE.FLO_IPHONE;
          //
          case DEVICE_TYPE.FLO_MAC_PROD:
          case DEVICE_TYPE.FLO_MAC_QC:
            return DEVICE_TOKEN_TYPE.FLO_MAC;
          //
          default:
            return DEVICE_TYPE[device.device_type];
        }
      })();
      if (key) {
        if (!filtered[key]) {
          filtered[key] = [];
        }
        filtered[key].push(device);
      }
      return filtered;
    }, {});
  }

  private getAPSForVideoCall(metadata, category: APNS_CATEGORY) {
    return {
      category,
      'invite-status': metadata?.invite_status,
      organizer: metadata?.organizer,
      'meeting-url': metadata?.meeting_url,
      'meeting-id': metadata?.meeting_id,
      'external-meeting-id': metadata?.external_meeting_id || '',
      'channel-id': metadata?.channel_id,
      title: metadata?.title,
      'call-type': metadata?.call_type,
      sender: metadata?.sender,
      'channel-arn': metadata?.channel_arn,
    };
  }

  private getAPSFromMetadata(metadata, category: APNS_CATEGORY) {
    const updatedObj = {};
    for (const key in metadata) {
      if (Object.prototype.hasOwnProperty.call(metadata, key)) {
        const updatedKey = key.replace(/_/g, '-').toLowerCase();
        updatedObj[updatedKey] = metadata[key];
      }
    }
    return updatedObj;
  }

  private getAPSInitial(showAlert: boolean, platform: DEVICE_TOKEN_TYPE) {
    return {
      priority: APS_DEFAUlT.priority,
      'content-available': showAlert
        ? CONTENT_AVAILABLE.ALERT
        : CONTENT_AVAILABLE.SILENT,
      // iPhone, iPad will not received notification silent without `sound`
      sound: platform === DEVICE_TOKEN_TYPE.FLO_MAC && !showAlert ? '' : APS_DEFAUlT.sound,
    };
  }

  private initApsObject(
    category: APNS_CATEGORY,
    payload: APNsData,
    showAlert: boolean,
    platform: DEVICE_TOKEN_TYPE
  ) {
    const apsMetadata =
      category === APNS_CATEGORY.VIDEO_CALL
        ? this.getAPSForVideoCall(payload.metadata, category)
        : this.getAPSFromMetadata(payload.metadata, category);

    const apsObj = {
      category,
      ...this.getAPSInitial(showAlert, platform),
      ...apsMetadata,
    };
    return apsObj;
  }

  private getAlertByMessageCode({ title, body, metadata }: APNsData, category: APNS_CATEGORY) {
    if (category === APNS_CATEGORY.VIDEO_CALL) {
      return {
        title: `${metadata.organizer}`,
        body: CALL_NOTIFICATION.BODY,
      };
    }
    return {
      title: title ?? metadata.title ?? metadata.email ?? '',
      body: body ?? metadata.body,
    };
  }

  private async sendAPNs(
    payload: APNsData,
    deviceToken: DeviceToken[],
    keyMaps: string,
    bundleId: string,
    showAlert: boolean,
    apnKeyPath: string,
    category: APNS_CATEGORY,
    platform: DEVICE_TOKEN_TYPE
  ): Promise<1 | 0> {
    try {
      // init message of push notification
      const notification = new Notification();
      // Current time in seconds
      const now = Math.floor(Date.now() / 1000);
      // Expires 5 minutes from now for CALL. Otherwise expires 1 hour from now.
      notification.expiry = now + (category === APNS_CATEGORY.VIDEO_CALL ? 300 : 3600);
      notification.topic = bundleId;
      notification.payload = { from: 'node-apn' };
      notification.aps.alert = {};
      if (showAlert === true) {
        // alert alway with sound
        notification.sound = 'default';
        notification.aps.alert = this.getAlertByMessageCode(payload, category);
      }
      // init aps object
      const apsObj = this.initApsObject(category, payload, showAlert, platform);
      // remap aps
      Object.keys(apsObj).forEach((key) => {
        notification.aps[key] = apsObj[key];
      });
      // innit provider
      const fullKeyPath = `${apnKeyPath}${keyMaps}.pem`;
      const apnProvider = new Provider({
        cert: fullKeyPath,
        key: fullKeyPath,
        production: +keyMaps % 2 === 0,
      });
      const rs = await Promise.all(
        deviceToken
          // use exactly pem to send
          .filter(
            ({
              device_type, cert_env
            }: DeviceToken) => `${keyMaps}` === `${device_type}${cert_env}`)
          // remove ignore device
          .filter(({ device_uid }: DeviceToken) => !payload.ignore_devices?.includes(device_uid)
          )
          // loop to send
          .map(async (dt: DeviceToken) => {
            // check is enable alert from build number before send
            if (showAlert && !this.isAllowAlert(dt.build_number, platform)) {
              notification.aps['content-available'] = CONTENT_AVAILABLE.SILENT;
              notification.aps.alert = {};
            }
            return apnProvider.send(notification, dt.device_token);
          }));

      LoggerService.getInstance()
        .logInfo(`SendAPNs:: length ${JSON.stringify(notification).length}`);

      LoggerService.getInstance().logInfo(`SendAPNs:: RESULT: ${JSON.stringify(rs)}`);
      return 1;
    } catch (error) {
      LoggerService.getInstance().logError(`SendAPNs:: Failed:: ${JSON.stringify(error)}`);
      return 0;
    }
  }

  isAllowAlert(buildNumber: number, platform: DEVICE_TOKEN_TYPE) {
    const validBuildNo = this.getBuildNumberWithPlatform(platform);

    return validBuildNo > 0 && buildNumber >= validBuildNo;
  }

  getBuildNumberWithPlatform(platform: DEVICE_TOKEN_TYPE): number {
    switch (platform) {
      case DEVICE_TOKEN_TYPE.FLO_IPAD:
        return cfAPNs().buildAlertIPad;
      case DEVICE_TOKEN_TYPE.FLO_IPHONE:
        return cfAPNs().buildAlertIPhone;
      case DEVICE_TOKEN_TYPE.FLO_MAC:
        return cfAPNs().buildAlertMac;
      default:
        return 0;
    }
  }

  detachDeviceToken(deviceToken: DeviceToken[]) {
    return deviceToken.map(({ device_token }) => device_token);
  }
}