import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { RequestParam } from '../../../common/swaggers/cloud.swagger';
export class DeleteCloudDTO {
  @IsInt()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}

export class DeleteCloudSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteCloudDTO,
    example: [
      {
        'id': 10
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteCloudDTO[];
  errors: DeleteCloudDTO[];
}