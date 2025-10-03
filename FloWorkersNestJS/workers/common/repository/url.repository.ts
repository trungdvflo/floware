import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { UrlEntity } from "../models/url.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(UrlEntity)
export class UrlRepository extends BaseRepository<UrlEntity> {
}