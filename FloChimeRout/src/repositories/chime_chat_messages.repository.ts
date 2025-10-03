import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ChimeChatMessagesEntity } from 'entities/chime_chat_messages.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ChimeChatMessagesEntity)
export class ChimeChatMessagesRepo extends Repository<ChimeChatMessagesEntity> {
	async getValidMessages(messageIds: string[], userID: number) {
		const alias = 'mes';
		return this.createQueryBuilder(alias)
		.where(`${alias}.user_id = :userID`, { userID })
		.andWhere(`${alias}.is_deleted = :isDeleted`, { isDeleted: 0 })
		.andWhere(`${alias}.internal_message_uid IN (:...messageIds)`, { messageIds })
		.getMany();
	}

	async getMaxMigrate(channelId: number): Promise<{max_time: number}> {
		const query = await this.manager.query(`SELECT MAX(ccm.migrate_time) max_time
		FROM chime_chat_messages ccm
		WHERE ccm.channel_id = ?`, [channelId]);

		return query[0];
	}
}