import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsInt,
    IsPositive, ValidateNested
} from "class-validator";

export class LeaveChannelDto {
    @IsInt()
    @IsPositive()
    @Expose()
    id: number;
    updated_date?: any;
}
export class LeaveChannelDtos {
    @ApiProperty({
        type: [LeaveChannelDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: LeaveChannelDto[];
    errors: any[];
}
