import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn,
  IsInt, IsNotEmpty, IsString, ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';

export class CredentialUpdateDTO {
  @IsInt()
  @Expose()
  id: number;

  @IsInt()
  @IsOptionalCustom()
  @IsIn([0])
  @Expose()
  type: number;

  @IsString()
  @IsNotEmpty()
  @Expose()
  data_encrypted: string;
}

export class CredentialUpdateSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CredentialUpdateDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CredentialUpdateDTO[];
  errors: any[];
}
