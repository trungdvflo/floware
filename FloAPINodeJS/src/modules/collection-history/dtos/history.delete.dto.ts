import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsDefined, IsInt, IsNotEmpty, IsPositive, ValidateNested
} from "class-validator";

export class DeleteHistoryDto {
    @IsPositive()
    @IsInt()
    @ApiProperty({
        example: 123
    })
    @IsDefined()
    @Expose()
    id: number;
    updated_date: any;
}
export class DeleteHistoryDtos {
    @ApiProperty({
        type: [DeleteHistoryDto],
        isArray: true
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @Expose()
    data: DeleteHistoryDto[];
    errors: any[];
}
