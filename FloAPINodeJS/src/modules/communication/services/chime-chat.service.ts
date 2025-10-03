import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CHAT_CHANNEL_TYPE } from '../../../common/constants';
import { HeaderAuth, IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import cfApp from '../../../configs/app';
import { DeleteMessageIntDTO } from '../../../modules/conference-chat/dtos/chatting-int.delete.dto';
import { EditMessageIntDTO } from '../../../modules/conference-chat/dtos/conference-chat.put.dto';
import { CallPhoneDTO, RemoveAttendeeDTO } from '../../conference-channel/dtos';
import { ListMessageIntDTO } from '../../conference-chat/dtos/chatting-int-message.post.dto';
import {
  ChatChannel,
  ChatMember,
  ChatService
} from '../interfaces';
export type IChimeChatMessage = {
  internal_channel_id: number;
  internal_channel_type: number;
  msg: string;
  meta_data?: object;
  is_realtime: 0 | 1
};
@Injectable()
export class ChimeChatService implements ChatService {
  private retryTimes: number;
  headers: HeaderAuth;
  constructor(
    private readonly httpClient: HttpService

  ) {
    this.retryTimes = 0;
  }

  setHeader(headers: HeaderAuth) {
    const { app_id, device_uid, authorization } = headers;
    this.headers = { app_id, device_uid, authorization };
    return this;
  }

  async batchGetMessagesChannel(params: ListMessageIntDTO) {
    try {
      const getMessagesChannelPath = `${cfApp().serverChimeUrl}/chatting-int/messages`;
      const { data } = await this.httpClient.axiosRef.get(getMessagesChannelPath, {
        params,
        headers: this.headers
      });
      return data;
    } catch (error) {
      const { data } = error.response;
      LoggerService.getInstance().logInternalError(data);
      return data;
    }
  }

  async batchCreateChannel(channels: ChatChannel[], user: IUser) {
    try {
      const createChannelPath = `${cfApp().serverChimeUrl}/chatting-int`;
      // 1.
      const { data: { data: chimeChannels = [] }
      } = await this.httpClient
        .axiosRef
        .post(createChannelPath, {
          data: channels
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = chimeChannels
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        await this.batchCreateChannel(
          saveFailed
            .map(({ internal_channel_id, internal_title, internal_channel_type, ref }) => ({
              internal_channel_id,
              internal_title,
              internal_channel_type,
              ref
            }))
          , user
        );
      }
      return 1;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async batchGenerateMember(members: ChatMember[]) {
    try {
      const createChannelPath = `${cfApp().serverChimeUrl}/chatting-int/generate-members`;
      const { data: { data: chimeMembers = [] } } = await this.httpClient
        .axiosRef
        .post(createChannelPath, {
          data: members
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = chimeMembers
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        return await this.batchGenerateMember(
          saveFailed
            .map(({ internal_user_id, internal_user_email }) => ({
              internal_user_id,
              internal_user_email
            }))
        );
      }
      return chimeMembers;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async batchCreateMember(members: ChatMember[]) {
    try {
      const createChannelPath = `${cfApp().serverChimeUrl}/chatting-int/members`;
      // 1.
      const { data: { data: chimeMembers = [] } } = await this.httpClient
        .axiosRef
        .post(createChannelPath, {
          data: members
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = chimeMembers
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        return await this.batchCreateMember(
          saveFailed
            .map(({ internal_channel_id, internal_user_id, internal_user_email }) => ({
              internal_channel_id,
              internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
              internal_user_id,
              internal_user_email
            }))
        );
      }
      return chimeMembers;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async batchRemoveMember(members: ChatMember[]) {
    try {
      const createChannelPath = `${cfApp().serverChimeUrl}/chatting-int/remove-members`;
      // 1.
      const { data: { data: chimeMembers = [] } } = await this.httpClient
        .axiosRef
        .post(createChannelPath, {
          data: members
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = chimeMembers
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        return await this.batchRemoveMember(
          saveFailed
            .map(({ internal_channel_id, internal_user_id, internal_user_email }) => ({
              internal_channel_id,
              internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
              internal_user_id,
              internal_user_email
            }))
        );
      }
      return chimeMembers;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async batchDeleteChannel(channels: ChatChannel[], user: IUser) {
    try {
      const createChannelPath = `${cfApp().serverChimeUrl}/chatting-int/delete`;
      // 1.
      const { data: { data: chimeChannels = [] }
      } = await this.httpClient
        .axiosRef
        .post(createChannelPath, {
          data: channels
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = chimeChannels
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        await this.batchDeleteChannel(
          saveFailed
            .map(({ internal_channel_id, internal_channel_type, ref }) => ({
              internal_channel_id,
              internal_channel_type,
              ref
            }))
          , user
        );
      }
      return 1;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async sendChatMessage(message: IChimeChatMessage) {
    try {
      // 1.
      const { data: { data: rs = [] } } = await this.httpClient.axiosRef
        .post(`${cfApp().serverChimeUrl}/chatting-int/messages`, {
          data: message
        }, {
          headers: this.headers
        });
      return rs;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async batchUpdateMessage(messages: EditMessageIntDTO[], user: IUser) {
    try {
      const editMessagePath = `${cfApp().serverChimeUrl}/chatting-int/messages`;
      // 1.
      const { data: { data: chimeChannels = [] }
      } = await this.httpClient.axiosRef
        .put(editMessagePath, {
          data: messages
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = chimeChannels
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        return await this.batchUpdateMessage(
          saveFailed
            .map(({
              internal_channel_id, internal_channel_type,
              internal_message_uid, msg, ref }) => ({
                internal_channel_id, internal_channel_type,
                internal_message_uid, msg, ref
              }))
          , user
        );
      }
      return chimeChannels;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async batchDeleteMessage(messages: DeleteMessageIntDTO[], user: IUser) {
    try {
      const delMessagePath = `${cfApp().serverChimeUrl}/chatting-int/messages/delete`;
      // 1.
      const { data: { data: deleteMessages = [] }
      } = await this.httpClient.axiosRef
        .post(delMessagePath, {
          data: messages
        }, {
          headers: this.headers
        });
      // 2. retry when failed with max 3
      const saveFailed = deleteMessages
        .filter(({ status }) => +status !== 1);
      if (this.retryTimes < 3 && saveFailed?.length > 0) {
        this.retryTimes += 1;
        return await this.batchDeleteMessage(
          saveFailed
            .map(({ internal_channel_id, internal_channel_type, internal_message_uid, ref }) => ({
              internal_channel_id,
              internal_channel_type,
              internal_message_uid,
              ref
            }))
          , user
        );
      }
      return deleteMessages;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
    }
  }

  async callMobile(call: CallPhoneDTO) {
    try {
      const delMessagePath = `${cfApp().serverChimeUrl}/meetings/call-phone`;
      const { data } = await this.httpClient.axiosRef
        .post(delMessagePath, {
          data: {
            MeetingId: call.meeting_id,
            PhoneNumber: call.phone_number,
          }
        }, {
          headers: this.headers
        });
      return data;
    } catch (error) {
      if (error.response.status === 404) {
        return { error: error?.response?.data?.message || '' };
      }
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }

  async removeAttendee(attendee: RemoveAttendeeDTO) {
    try {
      const delMessagePath =
        `${cfApp().serverChimeUrl}/meetings/${attendee.meeting_id}/attendees/${attendee.attendee_id}`;
      const { data } = await this.httpClient.axiosRef
        .delete(delMessagePath, {
          headers: this.headers
        });
      return data;
    } catch (error) {
      if (error.response.status === 400) {
        return { error: { message: "Attendee already deleted" } };
      }
      if (error.response.status === 404) {
        return { error: error.response.data };
      }
      LoggerService.getInstance().logInternalError(error);
      return { error: error.response.data };
    }
  }

  async getStatistics() {
    try {
      const { data } = await this.httpClient.axiosRef
        .get(`${cfApp().serverChimeUrl}/meetings/statistics`, {
          headers: this.headers
        });
      return data;
    } catch (error) {
      if (error.response.status === 404) {
        return { error: error.response.data };
      }
      LoggerService.getInstance().logInternalError(error);
      return { error: error.response.data };
    }
  }
}
