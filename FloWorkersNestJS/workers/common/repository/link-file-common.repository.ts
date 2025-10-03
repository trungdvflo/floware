import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { LinkedFileCommonEntity } from "../models/linked-file-common.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(LinkedFileCommonEntity)
export class LinkedFileCommonRepository extends BaseRepository<LinkedFileCommonEntity> {}