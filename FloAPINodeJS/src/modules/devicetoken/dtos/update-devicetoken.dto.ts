import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsIn, IsInt, IsNotEmpty,
  IsNumber, IsString, Min, ValidateNested
} from 'class-validator';
import {
  CERT_ENV, DEVICE_ENV,
  ENV_SILENT, STATUS_APP_RUN
} from '../../../common/constants/common';
import { IsOptionalCustom } from '../../../common/decorators';

export class UpdateDevicetokenDTO {
  @IsString()
  @ApiProperty({
    example: '4a56918ae4d86fa8c8511bd8681b802b'
  })
  @Expose()
  device_token: string;

  @IsNumber()
  @IsOptionalCustom()
  @Min(0)
  @ApiProperty({
    required: false,
    example: 1918470871.485
  })
  @Expose()
  time_sent_silent: number;

  @IsNumber()
  @IsOptionalCustom()
  @Min(0)
  @ApiProperty({
    required: false,
    example: 1918470871.485
  })
  @Expose()
  time_received_silent: number;

  @IsInt()
  @IsIn([
    STATUS_APP_RUN.ACTIVE,
    STATUS_APP_RUN.BACKGROUND,
    STATUS_APP_RUN.DEFAULT
  ])
  @IsNumber()
  @IsOptionalCustom()
  @ApiProperty({
    example: 1
  })
  @Expose()
  status_app_run: number;

  @IsInt()
  @IsIn([
    ENV_SILENT.SILENT,
    ENV_SILENT.ALERT,
  ])
  @IsOptionalCustom()
  @ApiProperty({
    example: 1
  })
  @Expose()
  env_silent: number;

  @IsInt()
  @IsIn([
    DEVICE_ENV.PRODUCTION,
    DEVICE_ENV.DEVELOPMENT
  ])
  @IsOptionalCustom()
  @ApiProperty({
    required: false,
    example: 1
  })
  @Expose()
  device_env: number;

  @IsInt()
  @IsIn([
    CERT_ENV.PRODUCTION,
    CERT_ENV.DEVELOPMENT,
    CERT_ENV.VOIP_PRODUCTION,
    CERT_ENV.VOIP_DEVELOPMENT
  ])
  @IsOptionalCustom()
  @Expose()
  cert_env: number;

  @IsInt()
  @IsOptionalCustom()
  @Expose()
  @ApiProperty({
    required: false,
    example: 1
  })
  replied: number;
}

export class UpdateDevicetokenDTOs {
  @IsNotEmpty()
  @ApiProperty({
    type: UpdateDevicetokenDTO
  })

  @ValidateNested()
  @Type(() => UpdateDevicetokenDTO)
  @Expose()
  data: UpdateDevicetokenDTO;

  errors: any[];
}