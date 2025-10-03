import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, ValidateNested
} from 'class-validator';
import { RequestParam } from '../../../common/swaggers/collection.swagger';

export class DeleteSeggestedCollectionDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}
export class DeleteSeggestedCollectionSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [DeleteSeggestedCollectionDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteSeggestedCollectionDTO[];
  errors: DeleteSeggestedCollectionDTO[];
}