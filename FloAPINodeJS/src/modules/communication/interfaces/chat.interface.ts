import { CHAT_CHANNEL_TYPE } from '../../../common/constants';
import { HeaderAuth, IUser } from '../../../common/interfaces';

export type ChatChannel = {
  internal_channel_id: number;
  internal_channel_type: CHAT_CHANNEL_TYPE;
  internal_title? : string;
  ref?: number;
};

export type ChatMember = {
  internal_channel_id?: number;
  internal_channel_type?: CHAT_CHANNEL_TYPE;
  internal_user_id: number;
  internal_user_email: string;
};

export interface ChatService {

  setHeader(headers: HeaderAuth);
  /**
   * @param channels
   * @param headers
   * @param user
   * @param trashGrabFn
   */
  batchCreateChannel(channels: ChatChannel[],
    user: IUser, trashGrabFn: () => void);

  /**
   * @param members
   * @param headers
   */
  batchCreateMember(members: ChatMember[]);

  /**
   * @param members
   * @param headers
   */
  batchRemoveMember(members: ChatMember[], headers: HeaderAuth);
}
