import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ConferenceHistory } from 'entities/conference_history.entity';
import { ConferenceMemberEntity } from 'entities/conference_member.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ConferenceMemberEntity)
export class ConferenceMemberRepo extends Repository<ConferenceMemberEntity> {
  async getConferenceByMeetingId(
    MeetingId: string,
  ): Promise<ConferenceMemberEntity> {
    const rs = await this.createQueryBuilder('cm')
      .select(['cm.title title', 'cm.channel_id channel_id'])
      .innerJoin(ConferenceHistory, 'ch', 'ch.member_id = cm.id')
      .where('ch.meeting_id = :MeetingId', { MeetingId })
      .getOne();
    if (rs?.channel_id > 0) {
      return rs;
    }
    return {
      title: '',
      channel_id: 0,
    } as ConferenceMemberEntity;
  }
}
