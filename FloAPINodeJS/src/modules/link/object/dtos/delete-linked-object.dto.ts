import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize,
  IsArray, IsInt, IsNotEmpty, IsPositive, ValidateNested
} from "class-validator";

export class DeleteLinkedObjectDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Expose()
  @ApiProperty({example: 1})
  id: number;
}

export class DeleteLinkedObjectSwagger{
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteLinkedObjectDto,
    example: [
      {
        'id': 10
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteLinkedObjectDto[];
  errors: DeleteLinkedObjectDto[];
}