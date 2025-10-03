import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CollectionActivityEntity } from "../models/collection-activity.entity";
import { BaseRepository } from "./base.repository";
@Injectable()
@CustomRepository(CollectionActivityEntity)
export class CollectionActivityRepository extends BaseRepository<CollectionActivityEntity> {
}