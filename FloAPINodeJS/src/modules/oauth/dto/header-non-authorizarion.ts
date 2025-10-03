import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MSG_ERR_HEADER } from '../../../common/constants/message.constant';

export class HeaderNonAuthDTO {
  @Expose()
  @IsString({
    message: 'Invalid app_id',
  })
  @IsNotEmpty({
    message: MSG_ERR_HEADER.APP_ID_IS_REQUIRED
  })
  @ApiProperty()
  app_id: string;

  @Expose()
  @MinLength(10, {
    message: MSG_ERR_HEADER.DEVICE_UID_LENGTH_MUST_BE_AT_LEAST_10_CHARACTERS_LONG,
  })
  @MaxLength(50, {
    message: MSG_ERR_HEADER.DEVICE_UID_LENGTH_MUST_BE_LESS_THAN_OR_EQUAL_TO_50_CHARACTERS_LONG,
  })
  @IsString({
    message: MSG_ERR_HEADER.INVALID_DEVICE_UID
  })
  @IsNotEmpty({
    message: MSG_ERR_HEADER.DEVICE_UID_IS_REQUIRED
  })
  @ApiProperty()
  device_uid: string;

  @Expose()
  @IsString({
    message: MSG_ERR_HEADER.INVALID_USER_AGENT
  })
  @IsOptional()
  @ApiProperty()
  user_agent: string;
}
