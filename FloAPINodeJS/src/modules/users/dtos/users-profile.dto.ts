import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsOptionalCustom } from "../../../common/decorators";

export class ReqUserProfileDto {

  @Expose()
  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required:false, type: String })
  fullname: string;

  @Expose()
  @IsString()
  @IsOptionalCustom()
  @MaxLength(500)
  @ApiProperty({ required:false, type: String })
  description: string;

  @Expose()
  @IsNumber()
  @IsOptionalCustom()
  @Max(1)
  @Min(0)
  @ApiProperty({ required:false, type: Number })
  gender: number;

  @Expose()
  @IsString()
  @IsOptionalCustom()
  @MaxLength(255)
  @ApiProperty({ required:false, type: String })
  birthday: string;

}

export class ResUserProfileDto {

  @ApiProperty({ type: String })
  @IsString()
  fullname: string;

  @ApiProperty({ type: String })
  @IsString()
  description: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  gender: number;

  @ApiProperty({ type: String })
  @IsString()
  birthday: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  quota_limit_bytes: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  disabled: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  updated_date: number;

  @ApiProperty({ type: String })
  @IsString()
  email: string;

}