import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { ThirdPartyAccountEntity } from "../models/third-party-account.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(ThirdPartyAccountEntity)
export class ThirdPartyAccountRepository extends BaseRepository<ThirdPartyAccountEntity> {
}