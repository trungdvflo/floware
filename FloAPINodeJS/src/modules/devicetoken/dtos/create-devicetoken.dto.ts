import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber, IsString,
  Min,
  ValidateNested
} from 'class-validator';
import {
  DEVICE_ENV,
  DEVICE_TYPE,
  ENV_SILENT,
  STATUS_APP_RUN
} from '../../../common/constants/common';
import { IsCertEnv, IsOptionalCustom } from '../../../common/decorators';

export class CreateDeviceTokenDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '4a56918ae4d86fa8c8511bd8681b802b'
  })
  @Expose()
  device_token: string;

  @IsInt()
  @IsIn([
    DEVICE_TYPE.FLO_INTERNAL,
    DEVICE_TYPE.FLO_IPAD_QC,
    DEVICE_TYPE.FLO_IPAD_PROD,
    DEVICE_TYPE.FLO_IPHONE_QC,
    DEVICE_TYPE.FLO_IPHONE_DEV,
    DEVICE_TYPE.FLO_MAC_PROD,
    DEVICE_TYPE.FLO_MAC_QC
  ])
  @ApiProperty({
    example: 1
  })
  @Expose()
  device_type: number;

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

  @IsOptionalCustom()
  @IsInt()
  @IsIn([
    STATUS_APP_RUN.ACTIVE,
    STATUS_APP_RUN.BACKGROUND,
    STATUS_APP_RUN.DEFAULT
  ])
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
    example: 1
  })
  @Expose()
  device_env: number;

  @IsInt()
  @IsCertEnv()
  @IsOptionalCustom()
  @ApiProperty({
    example: 1
  })
  @Expose()
  cert_env: number;

  @IsOptionalCustom()
  @ApiProperty({ required: false, example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @Expose()
  ref: string;
}

export class CreateDeviceTokenDTOs {
  @IsNotEmpty()
  @ApiProperty({
    type: CreateDeviceTokenDTO
  })
  @ValidateNested()
  @Type(() => CreateDeviceTokenDTO)
  @Expose()
  data: CreateDeviceTokenDTO;
  errors: any[];
}