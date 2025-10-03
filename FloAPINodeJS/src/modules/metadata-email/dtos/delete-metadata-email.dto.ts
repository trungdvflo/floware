import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

export class DeleteMetadataEmailDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  constructor(partial?: Partial<DeleteMetadataEmailDTO>) {
    Object.assign(this, partial);
  }
}

export class DeleteMetadataEmailDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [DeleteMetadataEmailDTO]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteMetadataEmailDTO[];

  errors: any[];
}