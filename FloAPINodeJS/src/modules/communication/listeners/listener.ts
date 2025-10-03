
import { HISTORY_ACTION, OBJECT_SHARE_ABLE, REPLY_SEND_STATUS, SEND_STATUS } from '../../../common/constants';
import { EventNames } from '../events';
import { RealTimeMessageCode } from '../interfaces';

export class Listener {
  private eventMessage = {
    // COLLECTION
    [EventNames.DECLINE_INVITE_COLLECTION]: '%s has declined to join the shared collection: %s',
    [EventNames.INVITE_COLLECTION]: 'You have been invited to the shared collection: %s',
    [EventNames.REMOVED_MEMBER_FROM_COLLECTION]: '%s have been removed from the shared collection: %s',
    [EventNames.MEMBER_LEAVE_COLLECTION]: '%s has left the shared collection: %s',
    [EventNames.JOIN_COLLECTION]: '%s has joined the shared collection: %s',
    [EventNames.DELETE_COLLECTION]: '%s has deleted the shared collection: %s',
    [EventNames.TRASH_COLLECTION]: '%s has move to trashed the shared collection: %s',
    [EventNames.RECOVER_COLLECTION]: '%s has recover from trashed the shared collection: %s',
    [EventNames.UPDATE_COLLECTION]: '%s has updated the shared collection: %s',
    [EventNames.CHANGE_ROLE_MEMBER_COLLECTION]: '%s has change role member %s in the shared collection: %s',
    [EventNames.ADD_COMMENT_COLLECTION]: '%s has add new a comment in the shared collection',
    [EventNames.UPDATE_COMMENT_COLLECTION]: '%s has updated a comment in the shared collection',
    [EventNames.DELETE_COMMENT_COLLECTION]: '%s has deleted a comment in the shared collection',
    [EventNames.MENTION_COMMENT_COLLECTION]: '%s has mention you to a comment in the shared collection',
    // CONFERENCE
    [EventNames.ADD_MEMBER_TO_CONFERENCE]: '%s has been added to the conference: %s',
    [EventNames.REVOKE_MEMBER_FROM_CONFERENCE]: '%s has been removed the conference: %s',
    [EventNames.DELETE_CONFERENCE_CHANNEL]: '%s has left the conference: %s',
  };

  getEventMessage(eventType: string,
    placeholders: string[]) {
    if (!Array.isArray(placeholders)) {
      throw new Error('Values must be an array');
    }
    const formatString = this.eventMessage[eventType] || '';

    const placeholdersCount = (formatString.match(/%s(?![0-9])/g) || []).length;

    if (placeholders.length !== placeholdersCount) {
      throw new Error(`Placeholders length do not match.`);
    }

    return this.eventMessage[eventType]
      .replace(/%s/g, () => `${placeholders.shift()}`);
  }

  getInviteMessage(code: number): string {
    return {
      [SEND_STATUS.invite_call]: `You has been invited to a meeting`,
      [SEND_STATUS.cancel_call]: `The meeting has been canceled`,
    }[code];
  }

  getReplyMessage(code: number, email: string): string {
    return {
      [REPLY_SEND_STATUS.call_success]: `${email} has accepted to the meeting`,
      [REPLY_SEND_STATUS.call_left]: `${email} has left to the meeting`,
      [REPLY_SEND_STATUS.call_busy]: `${email} has been busy to join the meeting`,
      [REPLY_SEND_STATUS.call_declined]: `${email} has declined to the meeting`,
      [REPLY_SEND_STATUS.call_not_answer]: `${email} hasn't answered to the meeting`,
      [REPLY_SEND_STATUS.call_cancel]: `${email} has canceled to the meeting`,
    }[code];
  }

  getVCALMessage(objectType: string, action: number) {
    return {
      [OBJECT_SHARE_ABLE.VTODO]: {
        [HISTORY_ACTION.CREATED]: {
          code: RealTimeMessageCode.TODO_CREATED,
          content: 'New ToDo',
        },
        [HISTORY_ACTION.EDITED]: {
          code: RealTimeMessageCode.TODO_UPDATED,
          content: 'ToDo Updated',
        },
        [HISTORY_ACTION.TRASHED]: {
          code: RealTimeMessageCode.TODO_TRASHED,
          content: 'ToDo Trashed',
        }
      },
      [OBJECT_SHARE_ABLE.VJOURNAL]: {
        [HISTORY_ACTION.CREATED]: {
          code: RealTimeMessageCode.NOTE_CREATED,
          content: 'New Note',
        },
        [HISTORY_ACTION.EDITED]: {
          code: RealTimeMessageCode.NOTE_UPDATED,
          content: 'Note Updated',
        },
        [HISTORY_ACTION.TRASHED]: {
          code: RealTimeMessageCode.NOTE_TRASHED,
          content: 'Note Trashed',
        }
      },
      [OBJECT_SHARE_ABLE.VEVENT]: {
        [HISTORY_ACTION.CREATED]: {
          code: RealTimeMessageCode.EVENT_CREATED,
          content: 'New Event',
        },
        [HISTORY_ACTION.EDITED]: {
          code: RealTimeMessageCode.EVENT_UPDATED,
          content: 'Event Updated',
        },
        [HISTORY_ACTION.TRASHED]: {
          code: RealTimeMessageCode.EVENT_TRASHED,
          content: 'Event Trashed',
        }
      },
      [OBJECT_SHARE_ABLE.URL]: {
        [HISTORY_ACTION.CREATED]: {
          code: RealTimeMessageCode.URL_CREATED,
          content: 'New Website'
        },
        [HISTORY_ACTION.EDITED]: {
          code: RealTimeMessageCode.URL_UPDATED,
          content: 'Website Updated'
        },
        [HISTORY_ACTION.TRASHED]: {
          code: RealTimeMessageCode.URL_TRASHED,
          content: 'Website Trashed'
        },
      },
    }[objectType][action] || {};
  }
}