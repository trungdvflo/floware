import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { SettingEntity } from "../models/setting.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(SettingEntity)
export class SettingRepository extends BaseRepository<SettingEntity> {
}