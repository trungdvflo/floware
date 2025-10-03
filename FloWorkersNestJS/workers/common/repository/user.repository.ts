import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { UserEntity } from "../models/user.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(UserEntity)
export class UserRepository extends BaseRepository<UserEntity> {
}