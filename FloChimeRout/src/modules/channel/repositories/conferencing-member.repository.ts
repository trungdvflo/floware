import { Injectable } from '@nestjs/common';
import { CHANNEL } from 'common/constants/system.constant';
import { IReqUser } from 'common/interfaces/auth.interface';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { GetConferencePagingDTO } from 'dto/base-get.dto';
import { ConferenceChannel } from 'entities/conference_channel.entity';
import { ConferenceHistory } from 'entities/conference_history.entity';
import { ConferenceMemberEntity } from 'entities/conference_member.entity';
import { Repository } from 'typeorm';

export interface GetMemberObjectOptions {
  userId: number;
  channelId: number;
}

export type WebGetAllParams = {
  filter: GetConferencePagingDTO,
  user: IReqUser
};

type SQL_SP = {
  spName: string;
  spParam: number;
};

const getPlaceholderByN = (n: number) => '?,'.repeat(n).substring(0, n * 2 - 1);
const LIST_OF_CONFERENCE: SQL_SP = { spName: `c2023_listOfConference`, spParam: 14 };

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
        `(${aliasName}.channel_id = :channelId AND ${aliasName}.user_id = :userId)`,
        { userId, channelId },
      );

    const rs = await query.getRawOne();
    return rs;
  }

  async listOfConference({ filter, user }: WebGetAllParams) {
    const {
      ids = []
      , collection_ids = []
      , channel_ids = []
      , filter_type = null
      , keyword = null
      , emails = null
      , modified_gte = null
      , modified_lt = null
      , min_id = null
      , page_size = null
      , page_no = null
      , sort = null
      , vip } = filter;
    const { spName, spParam } = LIST_OF_CONFERENCE;
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const raws = await slaveConnection
        .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
          keyword
          , emails
          , filter_type
          , collection_ids.length ? collection_ids.join() : null
          , channel_ids.length ? channel_ids.join() : null
          , user.id
          , ids.length ? ids.join() : null
          , modified_gte
          , modified_lt
          , min_id
          , vip
          , page_size
          , page_no
          , sort
        ]);
      const conference: ConferenceMemberEntity[] = !raws.length ? [] : raws[0];
      return !conference.length ? []
        : this.pickObject(user, conference, filter.fields);
    } finally {
      slaveConnection.release();
    }
  }

  pickObject(user: IReqUser, cnf: ConferenceMemberEntity[], fields: string[] = []): ConferenceMemberEntity[] {
    return cnf.map((item: ConferenceMemberEntity) => {
      const cleaned: ConferenceMemberEntity = this.conferenceTransform(item);
      const respond: ConferenceMemberEntity = new ConferenceMemberEntity();
      if (!fields.length)
        return cleaned;
      fields.forEach(field => {
        respond[field] = cleaned[field];
      });
      return respond;
    });
  }

  private conferenceTransform(conf: ConferenceMemberEntity): ConferenceMemberEntity {
    return {
      ...conf,
      participants: typeof conf.participants === 'string'
        ? JSON.parse(conf.participants as string)
        : conf.participants
    };
  }

  async getMeetingsByUser(userId: number) {
		const currentTimeMinus24Hour = Math.floor(Date.now() / 1000) - (3600 * CHANNEL.EXPIRE_TIME);
		const meetingItems = await this.createQueryBuilder('cm')
			.select(['ch.id id', 'ch.member_id member_id', 'ch.meeting_id meeting_id', 'ch.updated_date updated_date',
				'ch.external_meeting_id external_meeting_id', 'cm.channel_id channel_id'])
			.innerJoin(ConferenceHistory, 'ch', 'cm.id = ch.member_id and ch.start_time > ' + currentTimeMinus24Hour)
			.where("ch.user_id = :user_id", { user_id: userId })
			.andWhere("cm.revoke_time = :revoke_time", { revoke_time: CHANNEL.NONE_REVOKE })
			.groupBy("ch.meeting_id")
			.getRawMany();
		return meetingItems;
	}

}
