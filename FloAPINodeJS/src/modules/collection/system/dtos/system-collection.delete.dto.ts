import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { requestBodyDeleteSystemCollecion, RequestParam } from '../../../../common/swaggers/system-collection.swagger';
export class DeleteSystemCollectionDTO {
  @IsInt()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}

export class DeleteSystemCollectionSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteSystemCollectionDTO,
    example: [requestBodyDeleteSystemCollecion]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteSystemCollectionDTO[];
  errors: DeleteSystemCollectionDTO[];
}