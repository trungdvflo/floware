import { ApiProperty } from "@nestjs/swagger";
import { ParamError, RequestParamError } from "../../../common/interfaces";
import { KanbanCardErrorCode, KanbanCardResponseMessage } from "../kanban-card-response-message";
import { DeleteKanbanCardParam, KanbanCardParam } from "./kanban-card-param";

export class KanbanCardParamError implements ParamError<KanbanCardParam> {
  @ApiProperty({ example: KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND })
  code: KanbanCardErrorCode;

  @ApiProperty({ example: KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND,
    enum: KanbanCardResponseMessage })
  message: KanbanCardResponseMessage | string;

  @ApiProperty({ type: KanbanCardParam })
  attributes?: Partial<KanbanCardParam>;
  constructor(data: KanbanCardParamError) {
    Object.assign(this, {
      ...data,
      attributes: data.attributes && {
        ...data.attributes,
        object_uid: data.attributes?.object_uid?.getPlain()
      }
    });
  }
}

export class KanbanCardRequestParamError implements RequestParamError<KanbanCardParam> {
  @ApiProperty({ type: KanbanCardParamError, isArray: true })
  errors: KanbanCardParamError[];
  constructor(data: KanbanCardRequestParamError) {
    Object.assign(this, data);
  }
}

export class DeleteKanbanCardParamError implements ParamError<DeleteKanbanCardParam> {
  @ApiProperty({ example: KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND })
  code: KanbanCardErrorCode;

  @ApiProperty({ example: KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND,
    enum: KanbanCardResponseMessage })
  message: KanbanCardResponseMessage | string;

  @ApiProperty({ type: DeleteKanbanCardParam })
  attributes?: Partial<DeleteKanbanCardParam>;
  constructor(data: DeleteKanbanCardParamError) {
    Object.assign(this, data);
  }
}

export class DeleteKanbanCardRequestParamError
  implements RequestParamError<DeleteKanbanCardParam> {
  @ApiProperty({ type: DeleteKanbanCardParamError, isArray: true })
  errors: DeleteKanbanCardParamError[];
  constructor(data: DeleteKanbanCardRequestParamError) {
    Object.assign(this, data);
  }
}