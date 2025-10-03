import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { KanbanCardEntity } from "../models/kanban-card.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(KanbanCardEntity)
export class KanbanCardRepository extends BaseRepository<KanbanCardEntity> {
}