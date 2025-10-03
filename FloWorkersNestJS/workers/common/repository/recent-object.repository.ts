import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RecentObjectEntity } from "../models/recent-object.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RecentObjectEntity)
export class RecentObjectRepository extends BaseRepository<RecentObjectEntity> {
}