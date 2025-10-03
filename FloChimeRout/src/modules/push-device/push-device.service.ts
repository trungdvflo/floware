import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CallingPushDTO, InviteeCallParam } from './dtos/calling.post.dto';
import { CancelPushDTO, InviteeParam } from './dtos/cancel.post.dto';
import appConfig from '../../configs/app.config';
import { CALLING, SEND_STATUS } from 'common/constants/system.constant';
import { buildSingleResponseErr } from 'common/utils/respond';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import { Notification, Provider } from '@parse/node-apn';
import { TimestampDouble } from 'common/utils/datetime.util';

interface IAttendee {
  AttendeeId: string;
  ExternalUserId: string;
  JoinToken: string;
}

interface IDeviceToken {
  device_token: string;
  username: string;
  cert_env: number;
  device_type: number;
  env_silent: number;
  attendee?: IAttendee;
  pem?: string;
}
@Injectable()
export class PushDeviceService {
  private readonly mailServerUrl: string;
  private readonly apnKeyPath: string;
  private readonly apnKeyMap: JSON;
  private readonly apnExpire: number;
  constructor(private readonly httpClient: HttpService) {
    this.apnExpire = appConfig().apnExpire;
    this.apnKeyPath = appConfig().apnKeyPath;
    this.mailServerUrl = appConfig().serverMailUrl;
    this.apnKeyMap = appConfig().apnKeyMap
      ? JSON.parse(appConfig().apnKeyMap)
      : '';
  }

  private async getDeviceToken(
    lstInvitee: InviteeParam[],
  ): Promise<Array<object>> {
    const deviceTokenUrl = `${this.mailServerUrl}/devicetoken/item`;
    const inviteStr = lstInvitee
      .map((item: any) => {
        return item['Email'];
      })
      .join(',');

    const rs = await this.httpClient
      .get(deviceTokenUrl, {
        params: {
          username: inviteStr,
          inviteStatus: SEND_STATUS.cancel_call,
        },
      })
      .toPromise();
    return rs['data'];
  }

  private async apnPushInit(pemBundles) {
    try {
      const apnSilentPushs = {};
      Object.keys(pemBundles).forEach((pem) => {
        const FULL_KEY_PATH = `${this.apnKeyPath}${pem}.pem`;
        const pemNumber = parseInt(pem, 10);
        const production = pemNumber % 2 === 0;

        apnSilentPushs[pem] = new Provider({
          cert: FULL_KEY_PATH,
          key: FULL_KEY_PATH,
          production,
        });
      });
      return apnSilentPushs;
    } catch (error) {
      throw error;
    }
  }

  private async pushMessage(
    apnProvider: Provider,
    bundle: string,
    device: IDeviceToken,
    _data: CancelPushDTO | CallingPushDTO,
    typePush: number,
  ) {
    return new Promise((resolve) => {
      try {
        const notiMessage = new Notification();
        notiMessage.expiry = Math.floor(Date.now() / 1000) + this.apnExpire;
        notiMessage.topic = bundle;
        notiMessage.payload = {
          from: 'node-apn',
        };

        if (device['env_silent'] === 1) {
          notiMessage.sound = 'default';
          notiMessage.alert = {
            title: `${device.pem} ${bundle} PushChange ${TimestampDouble()}`,
            body: `PushChange`,
          };
        }
        notiMessage.aps['content-available'] = CALLING.contentAvailable;
        notiMessage.aps['category'] = CALLING.category;
        notiMessage.aps['priority'] = CALLING.priority;
        notiMessage.aps['sound'] = CALLING.sound;
        notiMessage.aps['InviteStatus'] = typePush;
        notiMessage.aps['Organizer'] = _data.Organizer;
        notiMessage.aps['MeetingUrl'] = _data.MeetingUrl;
        notiMessage.aps['ExternalMeetingId'] = _data.ExternalMeetingId;
        notiMessage.aps['CallType'] = _data.CallType;

        if (typePush === SEND_STATUS.invite_call) {
          const callingData = _data as CallingPushDTO;
          const {
            AudioFallbackUrl,
            AudioHostUrl,
            EventIngestionUrl,
            ScreenDataUrl,
            ScreenSharingUrl,
            ScreenViewingUrl,
            SignalingUrl,
            TurnControlUrl,
          } = callingData.Meeting.MediaPlacement;

          notiMessage.aps['Attendee'] = device.attendee;
          notiMessage.aps['Meeting'] = {
            ExternalMeetingId: callingData.Meeting.ExternalMeetingId,
            MediaRegion: callingData.Meeting.MediaRegion,
            MeetingId: callingData.Meeting.MeetingId,
            MediaPlacement: {
              AudioFallbackUrl,
              AudioHostUrl,
              EventIngestionUrl,
              ScreenDataUrl,
              ScreenSharingUrl,
              ScreenViewingUrl,
              SignalingUrl,
              TurnControlUrl,
            },
          };
        }

        apnProvider.send(notiMessage, device.device_token).then((result) => {
          resolve(result);
        });
      } catch (error) {
        throw error;
      }
    });
  }

  async pushCancelInvitees(_data: CancelPushDTO) {
    try {
      const { Invitee } = _data;

      const arrDeviceToken = await this.getDeviceToken(Invitee);
      const apnSilentPushInits = await this.apnPushInit(this.apnKeyMap);

      // push notify
      const pushNotification = [];
      if (arrDeviceToken.length > 0) {
        await Promise.all(
          arrDeviceToken.map((device: IDeviceToken) => {
            const keyPem = `${device.device_type}${device.cert_env}`;
            device.pem = keyPem;
            const provider = apnSilentPushInits[keyPem];
            if (provider) {
              const bundle = this.apnKeyMap[keyPem];
              this.pushMessage(
                provider,
                bundle,
                device,
                _data,
                SEND_STATUS.cancel_call,
              );
              pushNotification.push(device);
            }
          }),
        );
        return { data: pushNotification };
      }
      throw new BadRequestException(
        buildSingleResponseErr(
          ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
          ErrorMessage.DEVICE_TOKEN_DOES_NOT_EXIST,
          _data,
        ),
      );
    } catch (err) {
      throw err;
    }
  }

  async pushCallingInvitees(_data: CallingPushDTO) {
    try {
      const { Invitee } = _data;

      const arrDeviceToken = await this.getDeviceToken(Invitee);
      const apnSilentPushInits = await this.apnPushInit(this.apnKeyMap);

      // push notify
      const pushNotification = [];
      if (arrDeviceToken.length > 0) {
        // map device with invitee token
        await Promise.all(
          arrDeviceToken.map((device: IDeviceToken) => {
            const keyPem = `${device.device_type}${device.cert_env}`;
            device.pem = keyPem;
            // get Attendee with username
            const attendeeOfUser: InviteeCallParam = Invitee.find(
              (item) => item.Email === device.username,
            );
            const { AttendeeId, ExternalUserId, JoinToken } =
              attendeeOfUser.Attendee;

            device.attendee = {
              AttendeeId,
              ExternalUserId,
              JoinToken,
            };

            const provider = apnSilentPushInits[keyPem];
            if (provider) {
              const bundle = this.apnKeyMap[keyPem];
              this.pushMessage(
                provider,
                bundle,
                device,
                _data,
                SEND_STATUS.invite_call,
              );
              pushNotification.push(device);
            }
          }),
        );
        return { data: pushNotification };
      }
      throw new BadRequestException(
        buildSingleResponseErr(
          ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
          ErrorMessage.DEVICE_TOKEN_DOES_NOT_EXIST,
          _data,
        ),
      );
    } catch (err) {
      throw err;
    }
  }
}
