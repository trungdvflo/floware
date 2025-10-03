import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import {
  ConferenceChannelEntity
} from '../entities/conference-channel.entity';
import { ConferenceMemberEntity, Participant } from '../entities/conference-member.entity';

export interface GetMemberObjectOptions {
  userId: number;
  channelId: number;
}

@Injectable()
@CustomRepository(ConferenceMemberEntity)
export class ConferenceMemberRepository extends Repository<ConferenceMemberEntity> {
  async getInfoMember(options: GetMemberObjectOptions) {
    const { channelId, userId } = options;
    const aliasName = 'cm';
    const selectFields = [
      `${aliasName}.id id`,
      `${aliasName}.member_arn member_arn`,
      'cc.channel_arn channel_arn',
    ];

    const query = this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(ConferenceChannelEntity, 'cc', `cc.id = ${aliasName}.channel_id`)
      .where(`(${aliasName}.channel_id = :channelId AND ${aliasName}.user_id = :userId)`, {
        userId, channelId
      });

    const rs = await query.getRawOne();
    return rs;
  }

  async checkConferenceWithEmail(channel_id: number, email: string, user_id: number) {
    const itemMember = await this.createQueryBuilder("member")
      .innerJoin(ConferenceChannelEntity, "cc"
        , "cc.id=member.channel_id AND cc.id=:channel_id", { channel_id })
      .leftJoinAndSelect(ConferenceMemberEntity, "cm"
        , "cc.id=cm.channel_id AND cm.email=:email", { email })
      .where("member.user_id = :user_id", { user_id })
      .andWhere("member.revoke_time = 0")
      .select(["member.channel_id channel_id", "cm.revoke_time revoke_time", "cm.id id", "cm.created_by created_by",
        "cm.view_chat_history view_chat_history", "cm.join_time join_time", "cc.enable_chat_history enable_chat_history",
        "cm.is_creator is_creator", "cm.user_id user_id", "cm.created_date created_date"])
      .getRawOne();
    return itemMember;
  }

  async checkConferenceWithMemberId(member_id: number, user_id: number) {
    const itemMember = await this.createQueryBuilder("member")
      .innerJoin(ConferenceChannelEntity, "cc", "cc.id=member.channel_id")
      .innerJoinAndSelect(ConferenceMemberEntity, "cm"
        , "cc.id=cm.channel_id AND cm.revoke_time = 0 AND cm.user_id = :user_id", { user_id })
      .where("member.id = :id", { id: member_id })
      .select(["cm.id id", "cm.user_id user_id", "cm.email email", "cm.channel_id channel_id", "cm.created_by created_by", "cm.is_creator is_creator",
        "cc.title title"
      ])
      .getRawOne();
    return itemMember;
  }

  async getMembers4Check(channel_id: number, user_id: number) {
    const itemMember = await this.createQueryBuilder("member")
      .innerJoin(ConferenceChannelEntity, "cc"
        , "cc.id=member.channel_id AND cc.id=:channel_id", { channel_id })
      .leftJoinAndSelect(ConferenceMemberEntity, "cm"
        , "cc.id=cm.channel_id AND cm.user_id <> :user_id", { user_id })
      .where("member.user_id = :user_id", { user_id })
      .andWhere("member.revoke_time = 0")
      .select(["member.channel_id channel_id", "cm.revoke_time revoke_time", "cm.id id", "cm.user_id user_id", "cm.email email"])
      .getRawMany();
    return itemMember;
  }

  async getListParticipantByChannelId(channel_id: number[]): Promise<Participant[]> {
    const aliasName = 'cm1';
    const selectFields = [
      `${aliasName}.id id`,
      `${aliasName}.email email`,
      `${aliasName}.is_creator is_creator`,
      `${aliasName}.revoke_time revoke_time`,
      `${aliasName}.channel_id channel_id`,
    ];
    const query = this.createQueryBuilder(aliasName)
      .select(selectFields)
      .where(`${aliasName}.channel_id IN (:...channel_id)`, { channel_id });
    const participants = await query.getRawMany();
    return participants;
  }
}