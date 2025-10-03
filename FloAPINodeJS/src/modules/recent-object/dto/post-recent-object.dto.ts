import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { ErrorCode } from '../../../common/constants/error-code';
import { GetRecentObjectResponse } from './get-recent-object.dto';
import { RecentObjectDto, RecentObjectResponse } from './recent-object.dto';

export class PostRecentObjectDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @ApiProperty({ type: [RecentObjectDto] })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: RecentObjectDto[];
  errors: any[];
}

class PostRecentObjectError {
  @ApiResponseProperty({
    type: Array, example: {
      code: ErrorCode.VALIDATION_FAILED,
      message: 'account_id must be a positive number',
      attributes: {
        account_id: -1024,
        object_uid: 'df2d9d38-06aa-41d7-b5a7-d16965a7df1d@flodev.net',
        object_type: 'VCARD',
        object_href: '/calendarserver.php/calendars/tamvo@flodev.net/102df010-084d-0138-92d8-0242ac130003'
      }
    }
  })
  errors: object[];
}
export class PostRecentObjectResponse extends GetRecentObjectResponse {
  @ApiResponseProperty({ type: [RecentObjectResponse] })
  data: RecentObjectResponse[];

  @ApiResponseProperty({ type: PostRecentObjectError })
  error: PostRecentObjectError[];
}
