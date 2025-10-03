import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ParamError, RequestParamError } from "../../../common/interfaces";
import { KanbanErrorCode, KanbanResponseMessage } from "../kanban-response-message";
import { CreateKanbanBatchRequest } from "./create-kanban.request";
import { DeleteKanbanParam, KanbanParam, UpdateKanbanParam } from "./kanban-param";
import { UpdateKanbanBatchRequest } from "./update-kanban.request";

export class KanbanParamError implements ParamError<KanbanParam> {
  @ApiProperty({ example: 400 })
  code: KanbanErrorCode;

  @ApiProperty({ example: KanbanResponseMessage.COLLECTION_NOT_FOUND, enum: KanbanResponseMessage })
  message: KanbanResponseMessage | string;

  @ApiProperty({ type: KanbanParam })
  attributes?: Partial<KanbanParam>;
  constructor(data: KanbanParamError) {
    Object.assign(this, data);
  }
}

export class UpdateKanbanParamError implements ParamError<UpdateKanbanParam> {
  @ApiProperty({ example: 400 })
  code: KanbanErrorCode;

  @ApiProperty({ example: KanbanResponseMessage.COLLECTION_NOT_FOUND, enum: KanbanResponseMessage })
  message: KanbanResponseMessage | string;

  @ApiProperty({ type: UpdateKanbanParam })
  attributes?: Partial<UpdateKanbanParam>;
  constructor(data: UpdateKanbanParamError) {
    Object.assign(this, data);
  }
}
export class KanbanRequestParamError implements RequestParamError<KanbanParam> {
  @ApiProperty({ type: KanbanParamError, isArray: true })
  errors: KanbanParamError[];
  constructor(data: KanbanRequestParamError) {
    Object.assign(this, data);
  }
}

export class UpdateKanbanRequestParamError implements RequestParamError<UpdateKanbanParam> {
  @ApiProperty({ type: UpdateKanbanParamError, isArray: true })
  errors: UpdateKanbanParamError[];
  constructor(data: KanbanRequestParamError) {
    Object.assign(this, data);
  }
}

export class KanbanBadRequestParamError implements ParamError<CreateKanbanBatchRequest> {
  @ApiProperty({ example: 400, enum: HttpStatus })
  code: KanbanErrorCode;

  @ApiProperty({ example: 'Bad Request' })
  message: 'Bad Request';

  @ApiProperty({ type: CreateKanbanBatchRequest, isArray: true })
  attributes: CreateKanbanBatchRequest;
}

export class KanbanBadRequestError implements RequestParamError<CreateKanbanBatchRequest> {
  @ApiProperty({ type: KanbanBadRequestParamError, isArray: true })
  errors: KanbanBadRequestParamError[];
}

export class UpdateKanbanBadRequestParamError implements ParamError<UpdateKanbanBatchRequest> {
  @ApiProperty({ example: 400, enum: HttpStatus })
  code: KanbanErrorCode;

  @ApiProperty({ example: 'Bad Request' })
  message: 'Bad Request';

  @ApiProperty({ type: UpdateKanbanBatchRequest, isArray: true })
  attributes: UpdateKanbanBatchRequest;
}

export class UpdateKanbanBadRequestError implements RequestParamError<UpdateKanbanBatchRequest> {
  @ApiProperty({ type: UpdateKanbanBadRequestParamError, isArray: true })
  errors: UpdateKanbanBadRequestParamError[];
}

export class DeleteKanbanParamError implements ParamError<DeleteKanbanParam> {
  @ApiProperty({ example: 400 })
  code: KanbanErrorCode;

  @ApiProperty({ example: KanbanResponseMessage.COLLECTION_NOT_FOUND, enum: KanbanResponseMessage })
  message: KanbanResponseMessage | string;

  @ApiProperty({ type: DeleteKanbanParam })
  attributes?: Partial<DeleteKanbanParam>;
  constructor(data: DeleteKanbanParamError) {
    Object.assign(this, data);
  }
}

export class DeleteKanbanRequestParamError implements RequestParamError<DeleteKanbanParam> {
  @ApiProperty({ type: DeleteKanbanParamError, isArray: true })
  errors: DeleteKanbanParamError[];
  constructor(data: DeleteKanbanRequestParamError) {
    Object.assign(this, data);
  }
}