import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CreateCommentDto } from '../../../modules/collection-comment/dtos/comment.create.dto';
import { CollectionType } from '../../../modules/collection/dto/collection-param';
import { EventNames } from '../events';
import {
  ChangeRoleCollectionEvent,
  CollectionEvent,
  CollectionEventMetadata,
  CollectionObjectEvent,
  TrashCollectionEvent,
  UpdateCollectionEvent
} from '../events/collection.event';
import { ChannelType, Persistence, RealTimeMessageCode } from '../interfaces';
import { RealTimeService } from '../services';
import { Listener } from './listener';

@Injectable()
export class SharedCollectionListener extends Listener {
  constructor(private readonly realTimeService: RealTimeService) {
    super();
  }

  @OnEvent(EventNames.DECLINE_INVITE_COLLECTION)
  async handleDeclineInviteCollection({
    headers, collection, email, from, dateItem }: CollectionEvent) {
    // send notification to channel
    const metadata: CollectionEventMetadata = {
      from,
      email,
      collection_id: collection.id,
      collection_name: collection.name,
      event_timestamp: dateItem
    };
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(collection.id,
        RealTimeMessageCode.SHARED_COLLECTION_DECLINE,
        this.getEventMessage(EventNames.DECLINE_INVITE_COLLECTION, [email, collection.name]),
        metadata, ChannelType.SHARED_COLLECTION
      );
  }

  @OnEvent(EventNames.INVITE_COLLECTION)
  async handleInviteCollection({
    headers, collection, email, from, dateItem }: CollectionEvent) {
    const metadata: CollectionEventMetadata = {
      from,
      email,
      collection_id: collection.id,
      collection_name: collection.name,
      event_timestamp: dateItem
    };
    await this.realTimeService.setHeader(headers)
      .sendEventToIndividual(email,
        RealTimeMessageCode.SHARED_COLLECTION_INVITE,
        this.getEventMessage(EventNames.INVITE_COLLECTION, [collection.name]),
        metadata, Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.REMOVED_MEMBER_FROM_COLLECTION)
  async handleRemovedFromCollection({
    headers, collection, email, from, dateItem }: CollectionEvent) {
    //
    await this.realTimeService.setHeader(headers)
      .removeMemberFromChannel(collection.id, [{ email }], ChannelType.SHARED_COLLECTION);
    // send notification to channel˝
    const metadata: CollectionEventMetadata = {
      from,
      email,
      collection_id: collection.id,
      collection_name: collection.name,
      event_timestamp: dateItem
    };
    await this.realTimeService
      .setHeader(headers)
      .sendEventToIndividual(
        email,
        RealTimeMessageCode.SHARED_COLLECTION_REMOVE,
        this.getEventMessage(EventNames.REMOVED_MEMBER_FROM_COLLECTION, ['You', collection.name]),
        metadata,
      );

    await this.realTimeService
      .setHeader(headers)
      .sendEventToChannel(
        collection.id,
        RealTimeMessageCode.SHARED_COLLECTION_REMOVE,
        this.getEventMessage(EventNames.REMOVED_MEMBER_FROM_COLLECTION, [email, collection.name]),
        metadata,
        ChannelType.SHARED_COLLECTION
      );
  }

  @OnEvent(EventNames.MEMBER_LEAVE_COLLECTION)
  async handleLeaveCollection({
    headers, collection, email, from, dateItem }: CollectionEvent) {
    //
    await this.realTimeService.setHeader(headers)
      .removeMemberFromChannel(collection.id, [{ email }], ChannelType.SHARED_COLLECTION);
    //
    const metadata: CollectionEventMetadata = {
      from,
      email,
      collection_id: collection.id,
      collection_name: collection.name,
      event_timestamp: dateItem
    };
    // send notification to channel˝
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(collection.id,
        RealTimeMessageCode.SHARED_COLLECTION_LEAVE,
        this.getEventMessage(EventNames.MEMBER_LEAVE_COLLECTION, [email, collection.name]),
        metadata, ChannelType.SHARED_COLLECTION);
  }

  @OnEvent(EventNames.JOIN_COLLECTION)
  async handleJoinCollection({
    headers, collection, email, from, dateItem, type }: CollectionEvent) {
    //
    await this.realTimeService.setHeader(headers)
      .addMemberToChannel(collection.id, [{ email }], type);
    //
    const metadata: CollectionEventMetadata = {
      from,
      email,
      collection_id: collection.id,
      collection_name: collection.name,
      event_timestamp: dateItem
    };
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(collection.id,
        RealTimeMessageCode.SHARED_COLLECTION_JOIN,
        this.getEventMessage(EventNames.JOIN_COLLECTION, [email, collection.name]),
        metadata, ChannelType.SHARED_COLLECTION);
  }

  @OnEvent(EventNames.DELETE_COLLECTION)
  async handleDeleteCollection({
    headers, collection, email, from, dateItem, type }: CollectionEvent) {
    await this.realTimeService.setHeader(headers)
      .deleteChannel(collection.id, type);
    //
    const metadata: CollectionEventMetadata = {
      from,
      email,
      collection_id: collection.id,
      collection_name: collection.name,
      event_timestamp: dateItem
    };
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(collection.id,
        RealTimeMessageCode.SHARED_COLLECTION_JOIN,
        this.getEventMessage(EventNames.DELETE_COLLECTION, [email, collection.name]),
        metadata, ChannelType.SHARED_COLLECTION);
  }

  @OnEvent(EventNames.TRASH_COLLECTION)
  async handleTrashCollection(event: TrashCollectionEvent) {
    if (event?.collection?.type !== CollectionType.SharedCollection) {
      return;
    }
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      from: event.email,
      collection_id: event.collection.id,
      collection_name: event.collection.name
    };
    await this.realTimeService
      .sendSystemEventToChannel(event.collection.id,
        RealTimeMessageCode.OWNER_TRASH_SHARED_COLLECTION,
        this.getEventMessage(EventNames.TRASH_COLLECTION, [event.email, event.collection.name]),
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.RECOVER_COLLECTION)
  async handleRecoverCollection(event: TrashCollectionEvent) {
    if (event?.collection?.type !== CollectionType.SharedCollection) {
      return;
    }
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      from: event.email,
      collection_id: event.collection.id,
      collection_name: event.collection.name
    };
    await this.realTimeService
      .sendSystemEventToChannel(event.collection.id,
        RealTimeMessageCode.OWNER_RECOVER_SHARED_COLLECTION,
        this.getEventMessage(EventNames.RECOVER_COLLECTION, [event.email, event.collection.name]),
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.UPDATE_COLLECTION)
  async handleUpdateCollection(event: UpdateCollectionEvent) {
    if (event?.collection?.type !== CollectionType.SharedCollection) {
      return;
    }
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      from: event.email,
      collection_id: event.new_collection.id,
      collection_name: event.new_collection.name
    };
    await this.realTimeService
      .sendSystemEventToChannel(event.collection.id,
        RealTimeMessageCode.OWNER_UPDATE_SHARED_COLLECTION,
        this.getEventMessage(EventNames.UPDATE_COLLECTION, [event.email, event.collection.name]),
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.CHANGE_ROLE_MEMBER_COLLECTION)
  async handleChangeRoleCollection(event: ChangeRoleCollectionEvent) {
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      from: event.changeByMember,
      email: event.targetMember,
      access: event.access,
      collection_id: event.collection_id,
      collection_name: event.collection_name
    };
    await this.realTimeService
      .sendSystemEventToChannel(event.collection_id,
        RealTimeMessageCode.SHARED_COLLECTION_CHANGE_MEMBER_ROLE,
        this.getEventMessage(EventNames.CHANGE_ROLE_MEMBER_COLLECTION,
          [event.changeByMember, event.targetMember, event.collection_name]),
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.VCAL_SHARE_COLLECTION)
  async sendVCALEvent(event: CollectionObjectEvent) {
    if (!['VEVENT', 'VTODO', 'VJOURNAL', 'URL'].includes(event.object_type)) {
      return;
    }
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      collection_id: event.collection_id,
      object_uid: event.object_uid.getPlain(),
      object_href: event.object_href,
      object_title: event.content,
      collection_activity_id: event.collection_activity_id || '',
      email: event.email,
      action_time: event.action_time,
      assignees: event?.assignees || [],
    };
    if (event.object_type === 'URL') {
      delete metadata.object_href;
      delete metadata.assignees;
    }
    const { code, content } = this.getVCALMessage(event.object_type, event.action);

    if (!code || !content) { return; }

    await this.realTimeService
      .sendSystemEventToChannel(event.collection_id,
        code,
        content,
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.ADD_COMMENT_COLLECTION)
  async handleAddNewComment(event: { comment: any, email: string }) {
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      collection_id: event.comment.collection_id,
      object_uid: event.comment.object_uid.toString(),
      object_href: event.comment.object_href,
      collection_activity_id: event.comment.collection_activity_id,
      email: event.email,
      action_time: event.comment.action_time,
      object_type: event.comment.object_type.toString(),
      id: event.comment.id,
      comment: event.comment.comment,
      parent_id: event.comment.parent_id,
      mentions: event.comment.mentions || []
    };
    const messageCode = RealTimeMessageCode.OBJECT_COMMENT_CREATE;
    const message = this.getEventMessage(EventNames.ADD_COMMENT_COLLECTION,
      [event.email]);

    await this.realTimeService.sendSystemNotificationToChannel(
      event.comment.collection_id,
      messageCode,
      message,
      metadata,
      ChannelType.SHARED_COLLECTION,
      Persistence.PERSISTENCE,
    );
  }

  @OnEvent(EventNames.UPDATE_COMMENT_COLLECTION)
  async handleUpdateComment(event: { comment: any, email: string }) {
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      collection_id: event.comment.collection_id,
      object_uid: event.comment.object_uid.toString(),
      object_href: event.comment.object_href,
      collection_activity_id: event.comment.collection_activity_id,
      email: event.email,
      action_time: event.comment.action_time,
      object_type: event.comment.object_type.toString(),
      id: event.comment.id,
      comment: event.comment.comment,
      parent_id: event.comment.parent_id,
      mentions: event.comment.mentions || []
    };
    const messageCode = RealTimeMessageCode.OBJECT_COMMENT_UPDATE;
    const message = this.getEventMessage(EventNames.UPDATE_COMMENT_COLLECTION,
      [event.email]);
    await this.realTimeService
      .sendSystemEventToChannel(event.comment.collection_id,
        messageCode,
        message,
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.DELETE_COMMENT_COLLECTION)
  async handleDeleteComment(event: { comment: any, email: string }) {
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      collection_id: event.comment.collection_id,
      object_uid: event.comment.object_uid.toString(),
      /*
        know bugs,
        ignore check this field for now,
        let check https://floware.atlassian.net/browse/FB-2971
      */
      // object_href: event.comment.object_href.toString(),
      collection_activity_id: event.comment.collection_activity_id,
      email: event.email,
      action_time: event.comment.action_time,
      object_type: event.comment.object_type.toString(),
      id: event.comment.id,
      comment: event.comment.comment,
      parent_id: event.comment.parent_id
    };
    const message = this.getEventMessage(EventNames.DELETE_COMMENT_COLLECTION,
      [event.email]);
    await this.realTimeService
      .sendSystemEventToChannel(event.comment.collection_id,
        RealTimeMessageCode.OBJECT_COMMENT_DELETE,
        message,
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  async handleSaveComment(event: {
    comment: CreateCommentDto, comment_id: number, email: string,
    object_href: string, collection_activity_id: number
  }, action: number) {
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      collection_id: event.comment.collection_id,
      object_uid: event.comment.object_uid?.getPlain() || event.comment.object_uid,
      object_href: event.object_href,
      collection_activity_id: event.collection_activity_id,
      email: event.email,
      action_time: event.comment.action_time,
      object_type: event.comment.object_type,
      id: event.comment_id,
      comment: event.comment.comment,
      parent_id: event.comment.parent_id,
      mentions: event.comment.mentions || []
    };
    const messageCode = action === 1 ? RealTimeMessageCode.OBJECT_COMMENT_UPDATE
      : RealTimeMessageCode.OBJECT_COMMENT_CREATE;
    const message = action === 1
      ? this.getEventMessage(EventNames.UPDATE_COMMENT_COLLECTION,
        [event.email])
      : this.getEventMessage(EventNames.ADD_COMMENT_COLLECTION,
        [event.email]);
    await this.realTimeService
      .sendSystemEventToChannel(event.comment.collection_id,
        messageCode,
        message,
        metadata,
        ChannelType.SHARED_COLLECTION,
        Persistence.PERSISTENCE);
  }

  @OnEvent(EventNames.MENTION_COMMENT_COLLECTION)
  async handleMentionComment(event: {
    comment: CreateCommentDto,
    comment_id: number, new_mentions: string[], email: string,
    object_href: string, collection_activity_id: number
  }) {
    const metadata = {
      event_timestamp: new Date().getTime() / 1000,
      collection_id: event.comment.collection_id,
      object_uid: event.comment.object_uid.toString(),
      object_href: event.object_href,
      collection_activity_id: event.collection_activity_id,
      email: event.email,
      action_time: event.comment.action_time,
      object_type: event.comment.object_type.toString(),
      id: event.comment_id,
      comment: event.comment.comment,
      parent_id: event.comment.parent_id,
      mentions: event.comment.mentions || []
    };
    await this.realTimeService
      .sendSystemNotificationToIndividual(event.new_mentions,
        RealTimeMessageCode.OBJECT_COMMENT_MENTION,
        this.getEventMessage(EventNames.MENTION_COMMENT_COLLECTION,
          [event.email]),
        metadata);
  }
}