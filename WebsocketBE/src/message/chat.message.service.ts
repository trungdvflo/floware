import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, IsNull, MoreThanOrEqual } from 'typeorm';
import { getUTCSeconds } from '../common/utils/common';
import {
  ChannelMemberRepository, ChannelRepository, ChannelUserLastSeenRepository,
  MessageAttachmentRepository, MessageEditedHistoryRepository, MessageRepository
} from '../database/repositories';
import {
  ChannelUserLastSeenEvent,
  ChatDeleteMessageEvent,
  ChatSendMessageEvent,
  ChatUpdateMessageEvent,
  EventName,
} from '../events/interface.event';
import {
  IChatMessage,
  IChatMessageAttachment,
  MessageFilter,
  Type
} from '../interface/message.interface';
import { IPagination } from '../interface/pagination.interface';
import { IUser } from '../interface/user.interface';
import { MessageItemContentBody } from './dto/message.params';
import { MessageService } from './message.service';

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);
  constructor(
    private readonly messageReq: MessageRepository,
    private readonly messageService: MessageService,
    private readonly messageAttachmentReq: MessageAttachmentRepository,
    private readonly messageEditedHistoryReq: MessageEditedHistoryRepository,
    private readonly channelMemberReq: ChannelMemberRepository,
    private readonly channelReq: ChannelRepository,
    private readonly channelUserLastSeenReq: ChannelUserLastSeenRepository,
    private eventEmitter: EventEmitter2
  ) {}

  async send(user: IUser, message: IChatMessage) {
    const { attachments = [] } = message.payload?.metadata;
    const { message_uid } = message.payload;

    // check exist channel
    await this.isExistChannelOrThrowException(message.header.to[0], message.header.from);

    const enhancedMessage = await this._handleReplyQuoteForward(message);
    const results = await this.messageService.send(enhancedMessage);

    if (Array.isArray(attachments) && attachments.length > 0) {
      await this.saveMessageAttachment(attachments, message_uid);
    }

    const chatSendMessageEvent = {
      message,
      user,
    } as ChatSendMessageEvent;

    this.eventEmitter.emit(EventName.CHAT_MESSAGE_SEND, chatSendMessageEvent);

    return {
      data: results.data.shift(),
    };
  }

  private async _handleReplyQuoteForward(message: IChatMessage) {
    const { parent_uid, message_marked, content_marked } = message.payload;
    const { to } = message.header;
    const origin_message_uid = !parent_uid ? message_marked.message_uid : parent_uid;
    const message_marked_info = origin_message_uid
      ? await this.messageReq.getChatMessageByUid(origin_message_uid)
      : null;

    // check in case of quote | forward
    if (message_marked_info && Object.keys(message_marked).length > 0) {
      if (!message_marked_info.content.includes(content_marked)) {
        throw new BadRequestException('The original message must contain the content_marked');
      }

      if (message_marked_info.to_channel !== to[0]) {
        // forward
        if (content_marked !== message_marked_info.content) {
          throw new BadRequestException(
            'Forward message content_marked must be equal to the original message content'
          );
        }
      }
    }

    message.payload.message_marked = message_marked_info
      ? {
          message_uid: message_marked_info.uid,
          channel_id: message_marked_info.channel_id,
          email: message_marked_info.from,
          content: message_marked_info.content,
          metadata: message_marked_info.metadata ? JSON.parse(message_marked_info.metadata) : {},
          sent_time: message_marked_info.sent_time,
          created_date: message_marked_info.created_date,
          updated_date: message_marked_info.updated_date,
        }
      : {};

    return message;
  }

  async saveMessageAttachment(attachments: IChatMessageAttachment[], messageUid: string) {
    const attachmentEntities = attachments.map((attach) => {
      return { ...attach, ...{ message_uid: messageUid } };
    });
    const attachment = this.messageAttachmentReq.create(attachmentEntities);
    return await this.messageAttachmentReq.save(attachment);
  }

  async getChatUnread(channelName: string, lastMessageSent?: number) {
    let condition = {};
    if (lastMessageSent) {
      condition = {
        created_date: MoreThanOrEqual(lastMessageSent),
      };
    }
    const totalMessages = await this.messageReq.countBy({
      to_channel: channelName,
      ...condition,
    });

    return lastMessageSent ? totalMessages - 1 : totalMessages;
  }

  async getLastSeen(channelName: string, email: string) {
    const channel = await this.channelReq.findOneBy({
      name: channelName,
    });
    if (!channel?.id) {
      throw new HttpException(`Channel ${channelName} Not found`, HttpStatus.NOT_FOUND);
    }

    const channelMembers = await this.channelMemberReq.findBy({
      channel_id: channel.id,
    });

    const members = channelMembers.map((channelMember) => {
      return channelMember.email;
    });

    if (!members.includes(email)) {
      throw new HttpException(`Channel ${channelName} Not found`, HttpStatus.NOT_FOUND);
    }

    const userLastSeen = await this.channelUserLastSeenReq.findBy({
      channel_name: channelName,
    });

    return members.map((em) => {
      return {
        email: em,
        last_message_uid:
          userLastSeen.find((lastSeen) => lastSeen.email === em)?.last_message_uid || null,
      };
    });
  }

  async updateLastSeen(messageUid: string, channel: string, email: string) {
    const message = await this.messageReq.findOneBy({
      uid: messageUid,
    });
    if (!message?.id) {
      throw new BadRequestException('message not found');
    }

    let lastSeen = await this.channelUserLastSeenReq.findOneBy({
      email,
      channel_name: channel,
    });

    if (lastSeen?.id) {
      lastSeen.last_seen = getUTCSeconds();
      lastSeen.unread = await this.getChatUnread(channel, message.created_date);
      lastSeen.last_message_uid = messageUid;
    } else {
      lastSeen = this.channelUserLastSeenReq.create({
        email,
        channel_name: channel,
        last_message_uid: messageUid,
        last_seen: getUTCSeconds(),
        unread: await this.getChatUnread(channel, message.created_date),
      });
    }
    await this.channelUserLastSeenReq.save(lastSeen);
    this.eventEmitter.emit(EventName.CHAT_CHANNEL_USER_LAST_SEEN, {
      channel,
      email,
      last_message_uid: messageUid,
      last_seen: lastSeen.last_seen,
    } as ChannelUserLastSeenEvent);
    return {
      data: {
        status: true,
      },
    };
  }

  async updateMessage(param: MessageItemContentBody, email: string) {
    const { message_uid, content, metadata } = param;
    const message = await this.messageReq.findOneBy({
      uid: message_uid,
      from: email,
      type: Type.CHAT,
    });
    if (!message?.id || message?.deleted_date) {
      throw new HttpException(`Message ${message_uid} Not found`, HttpStatus.NOT_FOUND);
    }
    const oldMessage = { ...message };
    const oldContent = message.content;
    if (content !== undefined && content !== null) {
      message.content = content;
    }
    const oldMetadata = JSON.parse(message.metadata);
    if (param?.metadata) {
      message.metadata = JSON.stringify({
        ...oldMetadata,
        ...metadata,
      });
    }
    message.updateDates();
    const new_message = await this.messageReq.save(message);
    const history = this.messageEditedHistoryReq.create({
      message_uid: message.uid,
      email,
      content_before: oldContent,
    });
    await this.messageEditedHistoryReq.save(history);
    // send emit update message
    this.eventEmitter.emit(EventName.CHAT_MESSAGE_EDIT, {
      old_message: oldMessage,
      new_message,
      email,
    } as ChatUpdateMessageEvent);

    return {
      data: {
        status: true,
        created_date: new_message.created_date,
        updated_date: new_message.updated_date,
        deleted_date: 0,
      },
    };
  }

  async getAttachments(channel: string, email: string) {
    await this.isExistChannelOrThrowException(channel, email);
    return await this.messageAttachmentReq.getMesageAttachmentsFromChannel(channel);
  }

  async isExistChannelOrThrowException(channelName: string, email: string) {
    const channel = await this.channelReq.findOneBy({
      name: channelName,
    });
    if (!channel?.id) {
      throw new HttpException(`Channel ${channelName} Not found`, HttpStatus.NOT_FOUND);
    }
    const channelMember = await this.channelMemberReq.findOneBy({
      channel_id: channel.id,
      email,
    });
    if (!channelMember?.id) {
      throw new HttpException(`Channel ${channelName} Not found`, HttpStatus.NOT_FOUND);
    }
  }

  async getChatMessages(filter: MessageFilter, pagination: IPagination) {
    await this.isExistChannelOrThrowException(filter.channel, filter.email);
    const messages = await this.messageReq.getChatMessages(filter, pagination);

    messages.items = messages.items.map((message) => ({
      ...message,
      metadata: message?.metadata ? JSON.parse(message.metadata) : {},
      message_marked: message?.message_marked ? JSON.parse(message.message_marked) : null,
    }));

    //#region parent_ui use for replied message
    // const parentUids = messages.items.map((m) => m.parent_uid);
    // let parents = [];
    // if (parentUids.length > 0) {
    //   parents = await this.messageReq.findBy({
    //     uid: In(parentUids),
    //   });
    // }

    // const ms = messages.items.map((m) => {
    //   m.metadata = m?.metadata ? JSON.parse(m.metadata) : {};
    //   const parent = parents.find((pm) => pm.uid === m.parent_uid);
    //   delete m.parent_uid;

    //   if (parent?.metadata) {
    //     const parentMetadata = JSON.parse(parent.metadata);
    //     return {
    //       ...m,
    //       parent: {
    //         uid: parent.uid,
    //         content: parent.content,
    //         from: parent.from,
    //         metadata: parentMetadata,
    //         created_date: parent.created_date,
    //         update_date: parent.update_date,
    //       },
    //     };
    //   }

    //   return m;
    // });
    //#endregion

    // attach info delete/dit message
    const deleteMessages = messages.items.filter((m) => {
      return m.deleted_date && m.uid;
    });
    const deleteMessageUid = deleteMessages.map((m) => m.uid);

    let deleteMessageHistory = [];
    if (deleteMessageUid.length > 0) {
      deleteMessageHistory = await this.messageEditedHistoryReq.findBy({
        message_uid: In(deleteMessageUid),
      });
    }

    const finalMessages = [];
    for (const fm of messages.items) {
      // Create a new object based on fm without the 'deleted_date' property
      const { deleted_date, ...fmWithoutDeletedDate } = fm;

      const deletedHistory = deleteMessageHistory.find((dmh) => fm.uid === dmh.message_uid);
      if (deletedHistory?.id) {
        finalMessages.push({
          ...fmWithoutDeletedDate,
          deleted: { by: deletedHistory.email, time: deletedHistory.deleted_date },
        });
        continue;
      }

      if (fm.updated_date !== fm.created_date) {
        const lastHis = await this.getLastEditHistory(fm.uid);
        if (lastHis) {
          fmWithoutDeletedDate.edited = { by: lastHis.email, time: fm.updated_date };
        }
      }

      finalMessages.push(fmWithoutDeletedDate);
    }

    return { items: finalMessages, meta: messages.meta };
  }

  async getLastEditHistory(messageUid: string) {
    const mesageHistory = await this.messageEditedHistoryReq.find({
      take: 1,
      order: {
        created_date: 'DESC',
      },
      where: {
        message_uid: messageUid,
        deleted_date: IsNull(),
      },
    });
    return mesageHistory.length > 0 ? mesageHistory[0] : null;
  }

  async getChatMessage(messageUid: string, email: string) {
    const message = await this.messageReq.getChatMessageByUid(messageUid);

    if (!message?.id) {
      throw new HttpException(`Message ${messageUid} Not found`, HttpStatus.NOT_FOUND);
    }

    return {
      data: {
        ...message,
      },
    };
  }

  async deleteMessage(messageUid: string, userEmail: string) {
    const message = await this.messageReq.findOneBy({
      uid: messageUid,
      from: userEmail,
      type: Type.CHAT,
    });

    if (!message?.id) {
      throw new HttpException(`Message ${messageUid} Not found`, HttpStatus.NOT_FOUND);
    }

    message.deleted_date = getUTCSeconds();
    const oldMessage = { ...message };
    let editHistory = await this.messageEditedHistoryReq.findOneBy({
      message_uid: messageUid,
      email: userEmail,
    });
    if (!editHistory) {
      editHistory = this.messageEditedHistoryReq.create({
        message_uid: messageUid,
        email: userEmail,
      });
    }
    if (editHistory.deleted_date) {
      throw new HttpException(`Message ${messageUid} was deleted before!`, HttpStatus.BAD_REQUEST);
    }
    message.content = '';
    message.metadata = '{}';
    editHistory.deleted_date = message.deleted_date;
    const new_message = await this.messageReq.save(message);
    await this.messageEditedHistoryReq.save(editHistory);

    // send emit delete message
    this.eventEmitter.emit(EventName.CHAT_MESSAGE_DELETE, {
      new_message,
      old_message: oldMessage,
      email: userEmail,
    } as ChatDeleteMessageEvent);

    return {
      data: {
        status: true,
        created_date: new_message.created_date,
        updated_date: new_message.updated_date,
        deleted_date: new_message.deleted_date,
      },
    };
  }
}
