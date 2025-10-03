import { Injectable } from '@nestjs/common';
import { CHANNEL } from 'common/constants/system.constant';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ConferenceHistory } from 'entities/conference_history.entity';
import { ConferenceMemberEntity } from 'entities/conference_member.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ConferenceHistory)
export class ConferenceHistoryRepository extends Repository<ConferenceHistory> {
	async getInfoMeeting(ids: number[]) {
		const meetingItem = await this.createQueryBuilder()
			.select('ch.meeting_id', 'meeting_id')
			.from(ConferenceHistory, 'ch')
			.where((qb) => {
				const subQuery = qb
					.subQuery()
					.select('MAX(ch2.updated_date)')
					.from(ConferenceHistory, 'ch2')
					.where('ch2.member_id = ch.member_id')
					.getQuery();

				qb.where('ch.member_id IN (:...memberIds)', { memberIds: ids })
					.andWhere('ch.end_time = 0')
					.andWhere(`ch.updated_date = (${subQuery})`);
			}).getRawMany();
		return meetingItem;
	}

	async getMeetingByUser(userId: number) {
		const currentTimeMinus1Hour = Math.floor(Date.now() / 1000) - (3600 * CHANNEL.EXPIRE_TIME);
		const meetingItems = await this.createQueryBuilder('ch')
			.select(['ch.id id', 'ch.member_id member_id', 'ch.meeting_id meeting_id', 'ch.updated_date updated_date',
				'ch.external_meeting_id external_meeting_id', 'cm.channel_id channel_id'])
			.innerJoin(ConferenceMemberEntity, 'cm', 'cm.id = ch.member_id')
			.where("ch.user_id = :user_id", { user_id: userId })
			.andWhere("cm.revoke_time = :revoke_time", { revoke_time: CHANNEL.NONE_REVOKE })
			.andWhere("ch.is_calling = :is_calling", { is_calling: 1 })
			.andWhere("ch.updated_date > :updated_date", { updated_date: currentTimeMinus1Hour })
			.orderBy("ch.id", "DESC")
			.groupBy("ch.meeting_id")
			.limit(CHANNEL.TOTAL_MEETING)
			.getRawMany();
		return meetingItems;
	}

	
	async updateStatusChannel(ids: number[]) {
		await this.createQueryBuilder()
			.update()
			.set({ is_calling: 0 })
			.where("id IN (:...ids)", { ids })
			.execute();
	}
}
