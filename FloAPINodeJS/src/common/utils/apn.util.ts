import { Notification, Provider } from '@parse/node-apn';
import { InviteSilentPushDTO } from '../../modules/conference-invite/dtos';
import { SilentPushDTO } from "../../modules/devicetoken/dtos/slient-push.dto";
import { CALLING, CONTENT_AVAILABLE } from "../constants/common";
import { CALL_NOTIFICATION, MSG_PUSH_MAIL } from "../constants/message.constant";
import { LoggerService } from '../logger/logger.service';

export async function ApnVoipPush(data: SilentPushDTO, deviceToken: object[],
  keyMaps: number = 40, bundleId: string, showAlert: boolean = false, apnKeyPath: string) {
  try {
    const title = `${MSG_PUSH_MAIL.INVITED_CALL}${data.organizer}`;
    const alert = {
      body: MSG_PUSH_MAIL.BODY_CALL,
      title
    };

    const apsObj = {
      'priority': CALLING.priority,
      'content-available': CALLING.contentAvailable,
      'sound': CALLING.sound,
      'category': CALLING.category,
      'invite-status': data.invite_status,
      'organizer': data.organizer,
      'room-url': data.room_url,
      'room-id': data.room_id,
      'call-type': data.call_type
    };

    const production = (keyMaps % 2 === 0);
    const FULL_KEY_PATH = `${apnKeyPath}${keyMaps}.pem`;
    const options = {
      cert: FULL_KEY_PATH,
      key: FULL_KEY_PATH,
      production
    };

    // init message of push notification
    const notiMessage = new Notification();
    if (showAlert === true) {
      notiMessage.sound = 'default';
      notiMessage.alert = alert;
    }
    notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    notiMessage.topic = bundleId;
    notiMessage.payload = {
      from: 'node-apn',
    };

    Object.keys(apsObj).forEach(key => {
      notiMessage.aps[key] = apsObj[key];
    });

    const apnProvider = new Provider(options);
    await Promise.all(deviceToken.map(async (item) => {
      await apnProvider.send(notiMessage, item['device_token']);
    }));
    return 1;
  } catch (error) {
    LoggerService.getInstance().logInfo('ApnVoipPush:: Failed');
    return 1;
  }
}

export async function ApnPush(data: SilentPushDTO, deviceToken: object[],
  keyMaps: number = 40, bundleId: string, showAlert: boolean = false, apnKeyPath: string) {
  try {
    const title = `${MSG_PUSH_MAIL.INVITED_CALL}${data.organizer}`;
    const alert = {
      body: MSG_PUSH_MAIL.BODY_CALL,
      title
    };

    const apsObj = {
      'priority': CALLING.priority,
      'content-available': CALLING.contentAvailable,
      'sound': CALLING.sound,
      'category': CALLING.category,
      'invite-status': data.invite_status,
      'organizer': data.organizer,
      'room-url': data.room_url,
      'room-id': data.room_id,
      'call-type': data.call_type
    };

    const production = (keyMaps % 2 === 0);
    const FULL_KEY_PATH = `${apnKeyPath}${keyMaps}.pem`;
    const options = {
      cert: FULL_KEY_PATH,
      key: FULL_KEY_PATH,
      production
    };

    // init message of push notification
    const notiMessage = new Notification();
    if (showAlert === true) {
      notiMessage.sound = 'default';
      notiMessage.alert = alert;
    }
    notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    notiMessage.topic = bundleId;
    notiMessage.payload = {
      from: 'node-apn',
    };

    Object.keys(apsObj).forEach(key => {
      notiMessage.aps[key] = apsObj[key];
    });

    const apnProvider = new Provider(options);
    await Promise.all(deviceToken.map(async (item) => {
      await apnProvider.send(notiMessage, item['device_token']);
    }));
    return 1;
  } catch (error) {
    LoggerService.getInstance().logInfo('ApnPush:: Failed');
    return 1;
  }
}

export async function sendAPNs(data: InviteSilentPushDTO, deviceToken: object[],
  keyMaps: number = 40, bundleId: string, showAlert: boolean = false,
  apnKeyPath: string, fromMac = 0) {
  try {

    const apsObj = {
      'priority': CALLING.priority,
      'content-available': showAlert
        ? CONTENT_AVAILABLE.ALERT
        : CONTENT_AVAILABLE.SILENT,
      // iPhone, iPad will not received notification silent without `sound`
      // no sound for MAC silent push
      'sound': fromMac && !showAlert ? '' : CALLING.sound,
      'category': CALLING.category,
      'invite-status': data.invite_status,
      'organizer': data.organizer,
      'meeting-url': data.meeting_url,
      'meeting-id': data.meeting_id,
      'external-meeting-id': data.external_meeting_id || '',
      'channel-id': data.channel_id,
      'title': data.title,
      'call-type': data.call_type,
      'sender': data.sender,
      'channel-arn': data.channel_arn,
    };

    const production = (keyMaps % 2 === 0);
    const FULL_KEY_PATH = `${apnKeyPath}${keyMaps}.pem`;
    const options = {
      cert: FULL_KEY_PATH,
      key: FULL_KEY_PATH,
      production
    };
    // init message of push notification
    const notiMessage = new Notification();
    if (showAlert === true) {
      apsObj.title = `${MSG_PUSH_MAIL.INVITED_CALL}${data.organizer}`;
      notiMessage.aps.sound = 'default';
      notiMessage.aps.alert = {
        title: `${data.organizer}`,
        body: CALL_NOTIFICATION.BODY
      };
    }
    notiMessage.expiry = Math.floor(Date.now() / 1000) + 300; // Expires 5 minutes from now.
    notiMessage.topic = bundleId;
    notiMessage.payload = {
      from: 'node-apn',
    };

    Object.keys(apsObj).forEach(key => {
      notiMessage.aps[key] = apsObj[key];
    });

    const apnProvider = new Provider(options);
    await Promise.all(deviceToken.map(async (item) => {
      await apnProvider.send(notiMessage, item['device_token']);
    }));
    LoggerService.getInstance().logInfoFilter('APNs push:' + JSON.stringify(apsObj));
    return 1;
  } catch (error) {
    LoggerService.getInstance().logInfo('ApnPushV2:: Failed');
    return 1;
  }
}