import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsDefined, IsInt,
    IsNotEmpty,
    IsPositive, IsString, ValidateNested
} from "class-validator";

export class MoveChannelDto {

    @IsNotEmpty()
    @IsInt()
    @IsPositive()
    @IsDefined()
    @ApiProperty({ example: 1212 })
    @Expose()
    collection_id: number;

    @IsNotEmpty()
    @IsString()
    @IsDefined()
    @ApiProperty({ example: "ea673bfb-b9d3-4c97-818d-d3216578f826" })
    @Expose()
    channel_uid: string;
}
export class MoveChannelDtos {
    @ApiProperty({
        type: [MoveChannelDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: MoveChannelDto[];
    errors: any[];
}
