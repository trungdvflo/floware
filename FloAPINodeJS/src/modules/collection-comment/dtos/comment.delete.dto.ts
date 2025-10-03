import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsInt, IsPositive, ValidateNested
} from "class-validator";

export class DeleteCommentDto {
    @IsPositive()
    @Expose()
    @IsInt()
    @ApiProperty({
        example: 123
    })
    id: number;
    updated_date: any;
}
export class DeleteCommentDtos {
    @ApiProperty({
        type: [DeleteCommentDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: DeleteCommentDto[];
    errors: any[];
}
