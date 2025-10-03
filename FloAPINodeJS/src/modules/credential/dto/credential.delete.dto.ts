import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';

export class CredentialDeleteDTO {
  @IsInt()
  @Expose()
  id: number;
}

export class CredentialDeleteSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CredentialDeleteDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CredentialDeleteDTO[];
  errors: any[];
}
