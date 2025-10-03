import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

export class DeleteTrackingDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;

  constructor(partial?: Partial<DeleteTrackingDTO>) {
    Object.assign(this, partial);
  }
}

export class DeleteTrackingDTOs {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [DeleteTrackingDTO]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteTrackingDTO[];

  errors: any[];
}