import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ParamError, RequestParamError } from "../../../common/interfaces";
import { CollectionErrorCode, CollectionResponseMessage } from "../collection-response-message";
import { CreateCollectionParam, DeleteCollectionParam, UpdateCollectionParam } from "./collection-param";
import { CreateCollectionBatchRequest } from "./create-collection.request";

export class CollectionParamError implements ParamError<CreateCollectionParam> {
  @ApiProperty({ example: 400 })
  code: CollectionErrorCode;

  @ApiProperty({
    example: CollectionResponseMessage.COLLECTION_NOT_FOUND,
    enum: CollectionResponseMessage
  })
  message: CollectionResponseMessage | string;

  @ApiProperty({ type: CreateCollectionParam })
  attributes?: Partial<CreateCollectionParam>;
  constructor(data: CollectionParamError) {
    Object.assign(this, data);
  }
}
export class UpdateCollectionParamError implements ParamError<UpdateCollectionParam> {
  @ApiProperty({ example: 400 })
  code: CollectionErrorCode;

  @ApiProperty({
    example: CollectionResponseMessage.COLLECTION_NOT_FOUND,
    enum: CollectionResponseMessage
  })
  message: CollectionResponseMessage | string;

  @ApiProperty({ type: UpdateCollectionParam })
  attributes?: Partial<UpdateCollectionParam>;
  constructor(data: UpdateCollectionParamError) {
    Object.assign(this, data);
  }
}
export class CollectionRequestParamError implements RequestParamError<CreateCollectionParam> {
  @ApiProperty({ type: CollectionParamError, isArray: true })
  errors: CollectionParamError[];
  constructor(data: CollectionRequestParamError) {
    Object.assign(this, data);
  }
}

export class UpdateCollectionRequestParamError implements RequestParamError<UpdateCollectionParam> {
  @ApiProperty({ type: UpdateCollectionParamError, isArray: true })
  errors: UpdateCollectionParamError[];
  constructor(data: UpdateCollectionRequestParamError) {
    Object.assign(this, data);
  }
}

export class CollectionBadRequestParamError implements ParamError<CreateCollectionBatchRequest> {
  @ApiProperty({ example: 400, enum: HttpStatus })
  code: CollectionErrorCode;

  @ApiProperty({ example: 'Bad Request' })
  message: 'Bad Request';

  @ApiProperty({ type: CreateCollectionBatchRequest, isArray: true })
  attributes: CreateCollectionBatchRequest;
}

export class CollectionBadRequestError implements RequestParamError<CreateCollectionBatchRequest> {
  @ApiProperty({ type: CollectionBadRequestParamError, isArray: true })
  errors: CollectionBadRequestParamError[];
}

export class DeleteCollectionParamError implements ParamError<DeleteCollectionParam> {
  @ApiProperty({ example: 400 })
  code: CollectionErrorCode;

  @ApiProperty({
    example: CollectionResponseMessage.COLLECTION_NOT_FOUND,
    enum: CollectionResponseMessage
  })
  message: CollectionResponseMessage | string;

  @ApiProperty({ type: DeleteCollectionParam })
  attributes?: Partial<DeleteCollectionParam>;
  constructor(data: DeleteCollectionParamError) {
    Object.assign(this, data);
  }
}

export class DeleteCollectionRequestParamError implements RequestParamError<DeleteCollectionParam> {
  @ApiProperty({ type: DeleteCollectionParamError, isArray: true })
  errors: DeleteCollectionParamError[];
  constructor(data: DeleteCollectionRequestParamError) {
    Object.assign(this, data);
  }
}