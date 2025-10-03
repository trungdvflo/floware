import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';

export class GetPlatformReleaseDto {
  @ApiPropertyOptional({
    description: 'Version number of application',
    example: '1.1.1'
  })
  @Expose()
  @IsOptionalCustom()
  @IsString()
  version: string;

  @ApiProperty({
    description: `Unique number that marks the application build number.
    Rule: \n * Format: yymmddnn >. nn is version \n * The new version must be bigger than the current version in the DB`,
    example: 19082701
  })
  @Expose()
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Transform(({ value }) => +value)
  build_number: number;
}
export class GetPlatformReleaseDataResponse {
  @ApiResponseProperty({ example: 'e70f1b125cbad944424393cf309efaf0' })
  app_id: string;

  @ApiResponseProperty({ example: '1.0.1' })
  version: string;

  @ApiResponseProperty({ example: 19082701 })
  build_number: number;

  @ApiResponseProperty({ example: 'Upgrade new version' })
  title: string;

  @ApiResponseProperty({
    example: 'Our latest version has been released with many features for you'
  })
  message: string;

  @ApiResponseProperty({ example: 'https://example.com/' })
  url_download: string;

  @ApiResponseProperty({ example: 0 })
  force_update: number;

  @ApiResponseProperty({ example: 1566464330.816 })
  created_date: number;

  @ApiResponseProperty({ example: 1566464330.816 })
  updated_date: number;

  @ApiResponseProperty({ example: "15.1.1" })
  os_support: string;

  @ApiResponseProperty({ example: "7cLALFUHSwvEJWSkV8aMreoBe4fhRa4FncC5NoThKxwThL6FDR7hTiPJh1fo2uagnPogisnQsgFgq6mGkt2RBw==" })
  checksum: string;

  @ApiResponseProperty({ example: "Release note" })
  release_note: string;

  @ApiResponseProperty({ example: 1566464330.816 })
  release_time: number;

  @ApiResponseProperty({ example: 1566464330 })
  length: number; // the length of the file dmg
}

export class GetPlatformReleaseResponse {
  @ApiResponseProperty({ type: GetPlatformReleaseDataResponse })
  data: GetPlatformReleaseDataResponse | {};
}
