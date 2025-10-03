import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { SortObjectEntity } from "../models/sort-object.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(SortObjectEntity)
export class SortObjectRepository extends BaseRepository<SortObjectEntity> {

}