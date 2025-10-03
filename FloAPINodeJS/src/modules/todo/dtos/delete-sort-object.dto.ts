import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { RequestParam } from '../../../common/swaggers/cloud.swagger';
export class DeleteTodoDTO {
  @IsInt()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}

export class DeleteTodoSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteTodoDTO,
    example: [
      {
        'id': 10
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteTodoDTO[];
  errors: DeleteTodoDTO[];
}