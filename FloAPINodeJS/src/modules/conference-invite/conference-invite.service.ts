import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Json } from 'aws-sdk/clients/marketplacecatalog';
import { Repository } from 'typeorm';
import {
  APP_IDS,
  ApiLastModifiedName,
  CHAT_CHANNEL_TYPE,
  DEVICE_TOKEN_TYPE,
  DEVICE_TYPE,
  REPLY_SEND_STATUS,
  SEND_STATUS
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_DATA_INVALID,
  MSG_INVALID_CHANNEL_ID
} from '../../common/constants/message.constant';
import { ChimeChatChannelEntity } from '../../common/entities/chime-chat-channel.entity';
import { IReq, IUser } from '../../common/interfaces';
import { ConferenceHistoryRepository } from '../../common/repositories/conference-history.repository';
import { ConferenceRepository } from '../../common/repositories/conference.repository';
import { DeviceTokenRepository } from '../../common/repositories/devicetoken.repository';
import { sendAPNs } from '../../common/utils/apn.util';
import { AsyncForEach } from '../../common/utils/common';
import { getUtcSecond } from '../../common/utils/date.util';
import cfAws from '../../configs/aws';
import { ApiLastModifiedQueueService } from '../bullmq-queue';
import { WebSocketQueueService } from '../bullmq-queue/web-socket-queue.service';
import { EventNames, MeetingReplyEvent, MeetingSendEvent } from '../communication/events';
import {
  InviteSilentPushDTO,
  ReplySilentPushDTO
} from './dtos';

@Injectable()
export class ConferenceInviteService {
  private readonly apnKeyPath: string;
  private readonly apnKeyVoipIPad: Json;
  private readonly apnKeyMapIPad: Json;
  private readonly apnKeyVoipIPhone: Json;
  private readonly apnKeyMapIPhone: Json;
  private readonly apnKeyMapMacOS: Json;
  private readonly TITLE_MAX_LENGTH = 200;
  constructor(
    private readonly confHisRepo: ConferenceHistoryRepository,
    private readonly conferenceRepo: ConferenceRepository,
    private readonly deviceTokenRepo: DeviceTokenRepository,
    @InjectRepository(ChimeChatChannelEntity)
    private readonly chimeChannelRepo: Repository<ChimeChatChannelEntity>,
    private readonly webSocketService: WebSocketQueueService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.apnKeyPath = cfAws().apnKeyPath;
    this.apnKeyVoipIPad = cfAws().apnKeyVoipIPad ? JSON.parse(cfAws().apnKeyVoipIPad) : {};
    this.apnKeyMapIPad = cfAws().apnKeyMapIPad ? JSON.parse(cfAws().apnKeyMapIPad) : {};
    this.apnKeyVoipIPhone = cfAws().apnKeyVoipIPhone ? JSON.parse(cfAws().apnKeyVoipIPhone) : {};
    this.apnKeyMapIPhone = cfAws().apnKeyMapIPhone ? JSON.parse(cfAws().apnKeyMapIPhone) : {};
    this.apnKeyMapMacOS = cfAws().apnKeyMapMacOS ? JSON.parse(cfAws().apnKeyMapMacOS) : {};
  }

  /**
   * Filter all device by platform don't matter sandbox or not
   * @param devices
   * @returns
   */
  filterDevicesByType(devices: any[]): { [key: string]: any[] } {
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
  /**
   * get add invitee's access token
   * @param invitee
   * @param deviType
   * @returns
   */
  async getDeviceTokens(inviteeEmails: string[], voip: boolean, deviType: DEVICE_TYPE[] = []) {
    if (!inviteeEmails?.length) return [];
    const allDeviceToken = await this.deviceTokenRepo
      .listOfDeviceToken(inviteeEmails, voip, deviType);
    return this.filterDevicesByType(allDeviceToken);
  }

  async sendInvite(data: InviteSilentPushDTO, { user, headers }: IReq) {
    const { invitee } = data;
    if (!invitee?.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID,
        attributes: data
      });
    }
    // 0. check exist channel
    if (data.channel_id) {
      const channelExisted = await this.conferenceRepo
        .checkExistChannelByMember(data.channel_id, user.id);
      if (!channelExisted) {
        throw new BadRequestException({
          code: ErrorCode.CONFERENCE_NOT_EXIST,
          message: MSG_INVALID_CHANNEL_ID,
          attributes: data
        });
      }
    }

    data.title = (data.title?.length > this.TITLE_MAX_LENGTH) ?
      data.title.slice(0, this.TITLE_MAX_LENGTH) : data.title;
    const inviteeEmails = invitee.map(({ email }) => email)
      // prevent push APNs to organizer
      .filter(email => email !== data.organizer);

    // 1. Create conference_history 24 for invitee
    if (data.invite_status === SEND_STATUS.invite_call) {
      const updatedDate = getUtcSecond();
      const invitees = await this.confHisRepo
        .createConferenceHistoryForInvitee(data.channel_id, user.id, data.call_type,
          data.organizer, data.meeting_id, data.external_meeting_id, updatedDate);
      if (invitees.length > 0) {
        // send last modified to conference channel
        await this.apiLastModifiedQueueService.addJobConference({
          apiName: ApiLastModifiedName.CONFERENCE_HISTORY,
          channelId: data.channel_id,
          userId: user.id,
          updatedDate
        }, headers);
      }
    }
    // 2. get device token
    const deviceTokens = await this.getDeviceTokens
      (inviteeEmails, data.invite_status !== SEND_STATUS.cancel_call);

    if (!Object.keys(deviceTokens).length) {
      // no one for call
      return {
        itemPass: [],
        itemFail: []
      };
    }
    if (data.channel_id) {
      const chimeChannel = await this.chimeChannelRepo.findOne({
        where: {
          internal_channel_id: data.channel_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
        }
      });
      data.channel_arn = chimeChannel?.channel_arn;
    }
    // add sender for send-invite
    data.sender = user.email;
    // 1. Call WEB
    const { webPassed, webFailed } = await this.sendWebCall(data, deviceTokens);

    // 2. Call IPAD
    const { iPadPassed, iPadFailed } = await this.sendIPadCall(data, deviceTokens);

    // 3. Call Iphone
    const { iPhonePassed, iPhoneFailed } = await this.sendIPhoneCall(data, deviceTokens);

    // 4. Call Mac
    const { macOSPassed, macOSFailed } = await this.sendMacOSCall(data, deviceTokens);

    // trigger realtime event
    await this.eventEmitter
      .emit(EventNames.SEND_MEETING_INVITE_OLD, {
        headers,
        sender: user.email,
        emails: inviteeEmails,
        data,
        dateItem: getUtcSecond()
      } as MeetingSendEvent);
    return {
      itemPass: [...iPhonePassed, ...iPadPassed, ...webPassed, ...macOSPassed],
      itemFail: [...iPhoneFailed, ...iPadFailed, ...webFailed, ...macOSFailed]
    };

  }

  async replyInvite(data: ReplySilentPushDTO, { user, headers }: IReq) {
    if (!data?.invitee) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID,
        attributes: data
      });
    }
    const { invitee } = data;
    if (!invitee?.length) {
      throw new BadRequestException({
        code: ErrorCode.CONFERENCE_NOT_EXIST,
        message: MSG_DATA_INVALID,
        attributes: data
      });
    }
    if (data.channel_id) {
      const channelExisted = await this.conferenceRepo
        .checkExistChannelByMember(data.channel_id, user.id, true);
      if (!channelExisted) {
        throw new BadRequestException({
          code: ErrorCode.INVALID_DATA,
          message: MSG_INVALID_CHANNEL_ID,
          attributes: data
        });
      }
    }

    let inviteeEmails;
    if (data.reply_status === REPLY_SEND_STATUS.call_success
      || data.reply_status === REPLY_SEND_STATUS.call_declined) {
      inviteeEmails = invitee.concat([{ email: data.organizer }])
        .map(({ email }) => email);
    } else {
      inviteeEmails = invitee.filter(ivt => ivt.email !== user.email)
        .concat([{ email: data.organizer }])
        .map(({ email }) => email);
    }

    const deviceTokens = await this.getDeviceTokens(inviteeEmails, false);

    if (!Object.keys(deviceTokens).length) {
      return {
        itemPass: [],
        itemFail: []
      };
    }

    // reply Call WEB
    const { webPassed, webFailed } = await this.replyWebCall(data, deviceTokens, user);

    // reply Rely IPAD
    const { iPadPassed, iPadFailed } = await this.replyIPadCall(data, deviceTokens, user);

    // reply Rely IPHONE
    const { iPhonePassed, iPhoneFailed } = await this.replyIPhoneCall(data, deviceTokens, user);

    // reply MAC
    const { macOSFailed, macOSPassed } = await this.replyMacOSCall(data, deviceTokens, user);

    await this.eventEmitter
      .emit(EventNames.REPLY_MEETING_INVITE_OLD, {
        headers,
        sender: user.email,
        emails: inviteeEmails,
        data,
        dateItem: getUtcSecond()
      } as MeetingReplyEvent);

    return {
      itemPass: [...iPhonePassed, ...iPadPassed, ...webPassed, ...macOSPassed],
      itemFail: [...iPhoneFailed, ...iPadFailed, ...webFailed, ...macOSFailed]
    };
  }

  async sendWebCall(data, deviceTokens) {
    const webPassed = [];
    const webFailed = [];
    const webTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_WEB];
    const webUid = webTokens?.map(({ device_uid }) => ({ device_uid }));

    if (!webUid?.length) {
      return { webPassed, webFailed };
    }
    const rs = await this.webSocketService
      .floAppCallFloWebSocket(data);
    rs === 1
      ? webPassed.push(...webUid)
      : webFailed.push(...webUid);
    return { webPassed, webFailed };
  }

  async sendIPadCall(data, deviceTokens) {
    const iPadPassed = [];
    const iPadFailed = [];
    const ipadTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_IPAD];
    if (!ipadTokens?.length) {
      return { iPadPassed, iPadFailed };
    }
    await AsyncForEach(
      data.invite_status === SEND_STATUS.cancel_call
        ? this.apnKeyMapIPad
        : this.apnKeyVoipIPad, async (bundleId, key) => {
          let rs = null;
          rs = await sendAPNs(data, ipadTokens, key, bundleId, false, this.apnKeyPath);
          rs === 1
            ? iPadPassed.push(...ipadTokens.map(token => token.device_token))
            : iPadFailed.push(...ipadTokens);
        });
    return {
      iPadPassed: [...new Set(iPadPassed)].map(device_token => ({ device_token })),
      iPadFailed
    };
  }

  async sendIPhoneCall(data, deviceTokens) {
    const iPhonePassed = [];
    const iPhoneFailed = [];
    const iPhoneTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_IPHONE];
    if (!iPhoneTokens?.length) {
      return { iPhonePassed, iPhoneFailed };
    }
    await AsyncForEach(
      data.invite_status === SEND_STATUS.cancel_call
        ? this.apnKeyMapIPhone
        : this.apnKeyVoipIPhone, async (bundleId, key) => {
          let rs = null;
          rs = await sendAPNs(data, iPhoneTokens, key, bundleId, false, this.apnKeyPath);
          rs === 1
            ? iPhonePassed.push(...iPhoneTokens.map(token => token.device_token))
            : iPhoneFailed.push(...iPhoneTokens);
        });
    return {
      iPhonePassed: [...new Set(iPhonePassed)].map(device_token => ({ device_token })),
      iPhoneFailed
    };
  }

  async replyIPhoneCall(data, deviceTokens, user?: IUser) {
    const iPhonePassed = [];
    const iPhoneFailed = [];
    let iPhoneTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_IPHONE];

    if (!iPhoneTokens?.length) {
      return { iPhonePassed, iPhoneFailed };
    }
    if (data.reply_status === REPLY_SEND_STATUS.call_success
      || data.reply_status === REPLY_SEND_STATUS.call_declined) {
      if (data?.device_token && user.appId !== APP_IDS.web) {
        iPhoneTokens = iPhoneTokens.filter(item => item.device_token !== data.device_token);
      }
    }

    const replyData: InviteSilentPushDTO = {
      ...data,
      invite_status: data.reply_status,
      sender: user.email
    };
    await AsyncForEach(this.apnKeyMapIPhone, async (bundleId, key) => {
      const rs = await sendAPNs(replyData, iPhoneTokens, key, bundleId, false, this.apnKeyPath);
      rs === 1
        ? iPhonePassed.push(...iPhoneTokens.map(token => token.device_token))
        : iPhoneFailed.push(...iPhoneTokens);
    });
    return {
      iPhonePassed: [...new Set(iPhonePassed)].map(device_token => ({ device_token })),
      iPhoneFailed
    };
  }

  async sendMacOSCall(data, deviceTokens) {
    const macOSPassed = [];
    const macOSFailed = [];
    const macOSTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_MAC];
    if (!macOSTokens?.length) {
      return { macOSPassed, macOSFailed };
    }
    await AsyncForEach(
      this.apnKeyMapMacOS
      , async (bundleId, key) => {
        let rs = null;
        rs = await sendAPNs(data, macOSTokens, key, bundleId,
          data.invite_status === SEND_STATUS.invite_call, this.apnKeyPath, 1);
        rs === 1
          ? macOSPassed.push(...macOSTokens.map(token => token.device_token))
          : macOSFailed.push(...macOSTokens);
      });
    return {
      macOSPassed: [...new Set(macOSPassed)].map(device_token => ({ device_token })),
      macOSFailed
    };
  }

  async replyMacOSCall(data, deviceTokens, user?: IUser) {
    const macOSPassed = [];
    const macOSFailed = [];
    let macOSTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_MAC];

    if (!macOSTokens?.length) {
      return { macOSPassed, macOSFailed };
    }
    if (data.reply_status === REPLY_SEND_STATUS.call_success
      || data.reply_status === REPLY_SEND_STATUS.call_declined) {
      if (data?.device_token && user.appId !== APP_IDS.web) {
        macOSTokens = macOSTokens.filter(item => item.device_token !== data.device_token);
      }
    }

    const replyData: InviteSilentPushDTO = {
      ...data,
      invite_status: data.reply_status,
      sender: user.email
    };
    await AsyncForEach(this.apnKeyMapMacOS, async (bundleId, key) => {
      const rs = await sendAPNs(replyData, macOSTokens, key, bundleId, false, this.apnKeyPath, 1);
      rs === 1
        ? macOSPassed.push(...macOSTokens.map(token => token.device_token))
        : macOSFailed.push(...macOSTokens);
    });
    return {
      macOSPassed: [...new Set(macOSPassed)].map(device_token => ({ device_token })),
      macOSFailed
    };
  }

  async replyIPadCall(data, deviceTokens, user?: IUser) {
    const iPadPassed = [];
    const iPadFailed = [];
    let ipadTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_IPAD];

    if (!ipadTokens?.length) {
      return { iPadPassed, iPadFailed };
    }
    if (data.reply_status === REPLY_SEND_STATUS.call_success
      || data.reply_status === REPLY_SEND_STATUS.call_declined) {
      if (data?.device_token && user.appId !== APP_IDS.web) {
        ipadTokens = ipadTokens.filter(item => item.device_token !== data.device_token);
      }
    }

    const replyData: InviteSilentPushDTO = {
      ...data,
      invite_status: data.reply_status,
      sender: user.email
    };
    await AsyncForEach(this.apnKeyMapIPad, async (bundleId, key) => {
      const rs = await sendAPNs(replyData, ipadTokens, key, bundleId, false, this.apnKeyPath);
      rs === 1
        ? iPadPassed.push(...ipadTokens.map(token => token.device_token))
        : iPadFailed.push(...ipadTokens);
    });
    return {
      iPadPassed: [...new Set(iPadPassed)].map(device_token => ({ device_token })),
      iPadFailed
    };
  }

  async replyWebCall(data, deviceTokens, user?: IUser) {
    const webPassed = [];
    const webFailed = [];
    const webTokens = deviceTokens[DEVICE_TOKEN_TYPE.FLO_WEB];

    let webUid = webTokens?.map(({ device_uid }) => ({ device_uid }));

    if (data.reply_status === REPLY_SEND_STATUS.call_success
      || data.reply_status === REPLY_SEND_STATUS.call_declined) {
      if (webUid?.length > 0 && !data?.device_token && user.appId === APP_IDS.web) {
        webUid = webUid.filter(item => item.device_uid !== user.deviceUid);
      }
    }

    if (!webUid?.length) {
      return { webPassed, webFailed };
    }

    const rs = await this.webSocketService
      .floAppReplyFloWebSocket({ ...data, sender: user.email });
    rs === 1
      ? webPassed.push(...webUid)
      : webFailed.push(...webUid);
    return { webPassed, webFailed };
  }
}