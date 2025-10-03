import { Expose } from 'class-transformer';
import { Contains, IsHash, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { TYPE_TOKEN } from '../../../common/constants/oauth.constant';

export class HeaderAuthorizationDTO {
  @Expose()
  @IsNotEmpty()
  @IsHash('md5')
  @IsString()
  app_id: string;

  @Expose()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(50)
  @IsString()
  device_uid: string;

  @Expose()
  @IsNotEmpty()
  @Contains(TYPE_TOKEN)
  @IsString()
  authorization: string;
}