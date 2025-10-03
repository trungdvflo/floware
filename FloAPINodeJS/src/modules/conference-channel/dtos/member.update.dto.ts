import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsIn, IsInt, IsPositive, IsString, MaxLength, ValidateNested
} from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
import { ChannelCreateDto } from "./channel.create.dto";

export class MemberUpdateDto {
    @IsPositive()
    @Expose()
    @IsInt()
    id: number;

    @Expose()
    @IsString()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        example: 'Title of channel'
    })
    @MaxLength(2000)
    share_title: string;

    @Expose()
    @IsString()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        example: 'Title of channel'
    })
    @MaxLength(2000)
    title: string;

    @IsString()
    @Expose()
    @ApiPropertyOptional({
        example: 'Description of channel'
    })
    @IsOptionalCustom()
    @MaxLength(5000)
    description: string;

    @IsString()
    @IsOptionalCustom()
    @Expose()
    @ApiPropertyOptional({
        example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
    })
    avatar: string;

    @IsOptionalCustom()
    @IsIn([0, 1])
    @Expose()
    @ApiPropertyOptional({
        example: 1
    })
    vip: number;

    @IsIn([0, 1])
    @IsOptionalCustom()
    @Expose()
    @ApiPropertyOptional({
        example: 1
    })
    enable_chat_history: number;

    @IsString()
    @Transform(TRIM_STRING_TRANSFORMER)
    @Expose()
    @ApiPropertyOptional({
        example: ''
    })
    @MaxLength(2000)
    @IsOptionalCustom()
    room_url: string;

    updated_date: any;
}

export class MemberUpdateDtos {
    @ApiProperty({
        type: [ChannelCreateDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: MemberUpdateDto[];
    errors: any[];
}
