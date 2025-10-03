import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CardContactEntity } from "../models/card-contact.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(CardContactEntity)
export class CardContactRepository extends BaseRepository<CardContactEntity> {
}