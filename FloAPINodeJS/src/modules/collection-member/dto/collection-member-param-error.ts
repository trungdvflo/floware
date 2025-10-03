import { ApiProperty } from '@nestjs/swagger';
import { ParamError, RequestParamError } from '../../../common/interfaces';
import {
  CollectionMemberErrorCode,
  CollectionMemberResponseMessage
} from '../collection-member-response-message';
import { CollectionMemberParam } from './collection-member-param';

export class CollectionParamError implements ParamError<CollectionMemberParam> {
  @ApiProperty({ example: 400 })
  code: CollectionMemberErrorCode;

  @ApiProperty({
    example: CollectionMemberResponseMessage.COLLECTION_MEMBER_NOT_FOUND,
    enum: CollectionMemberResponseMessage,
  })
  message: CollectionMemberResponseMessage | string;

  @ApiProperty({ type: CollectionMemberParam })
  attributes?: Partial<CollectionMemberParam>;
  constructor(data: CollectionParamError) {
    Object.assign(this, data);
  }
}

export class CollectionRequestParamError implements RequestParamError<CollectionMemberParam> {
  @ApiProperty({ type: CollectionParamError, isArray: true })
  errors: CollectionParamError[];
  constructor(data: CollectionRequestParamError) {
    Object.assign(this, data);
  }
}
