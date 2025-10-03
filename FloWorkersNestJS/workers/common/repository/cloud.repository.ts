import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CloudEntity } from "../models/cloud.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(CloudEntity)
export class CloudRepository extends BaseRepository<CloudEntity> {
}