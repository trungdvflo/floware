import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ConferenceChannel } from 'entities/conference_channel.entity';
import { ConferenceMemberEntity } from 'entities/conference_member.entity';
import { Repository } from 'typeorm';

export interface GetMemberObjectOptions {
  userId: number;
  channelId: number;
}
@Injectable()
@CustomRepository(ConferenceMemberEntity)
export class ConferencingMemberRepository extends Repository<ConferenceMemberEntity> {
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
      .leftJoin(ConferenceChannel, 'cc', `cc.id = ${aliasName}.channel_id`)
      .where(
        `(${aliasName}.channel_id = :channelId AND ${aliasName}.user_id = :userId AND ${aliasName}.revoke_time = 0)`,
        { userId, channelId },
      );

    const rs = await query.getRawOne();
    return rs;
  }
}
