import { Injectable } from "@nestjs/common";
import { In } from "typeorm";
import { IS_TRASHED } from "../constants/common.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CollectionEntity } from "../models/collection.entity";
import { BaseRepository } from "./base.repository";
export interface CollectionServiceOptions {
	fields: (keyof CollectionEntity)[];
}
@Injectable()
@CustomRepository(CollectionEntity)
export class CollectionRepository extends BaseRepository<CollectionEntity> {

	findByParentId(userId: number, parent_id: number, options?: CollectionServiceOptions) {
		return this.find({
			select: options?.fields,
			where: {
				user_id: userId,
				parent_id
			}
		});
	}

	updateCollection(collectionIds: number[]) {
		this.createQueryBuilder().update(CollectionEntity)
			.set({ is_trashed: IS_TRASHED.DELETED })
			.where({ id: In(collectionIds) })
			.execute();
	}
}