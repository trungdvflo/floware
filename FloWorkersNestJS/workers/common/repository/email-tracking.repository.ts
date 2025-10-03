import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { EmailTrackingEntity } from "../models/email-tracking.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(EmailTrackingEntity)
export class EmailTrackingRepository extends BaseRepository<EmailTrackingEntity> {

}