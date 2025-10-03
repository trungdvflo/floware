import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
export class CredentialDTO {
  @IsInt()
  @IsIn([0])
  @IsOptionalCustom()
  @Expose()
  type: number;

  @IsString()
  @IsNotEmpty()
  @Expose()
  data_encrypted: string;

  @IsOptionalCustom()
  @IsString()
  @Expose()
  ref?: string;
}
export class CredentialSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CredentialDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CredentialDTO[];
  errors: any[];
}