import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize,
  IsArray, IsInt, IsNotEmpty, IsPositive, ValidateNested
} from "class-validator";
import { RequestParam } from "../../../../common/swaggers/link-collection-object.swagger";

export class DeleteLinkedCollectionObjectMemberDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Expose()
  @ApiProperty(RequestParam.id)
  id: number;
}
export class DeleteLinkedCollectionObjectMemberSwagger{
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteLinkedCollectionObjectMemberDto,
    example: [
      {
        'id': 10
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteLinkedCollectionObjectMemberDto[];
  errors: DeleteLinkedCollectionObjectMemberDto[];
}