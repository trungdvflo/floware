import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsIn, IsNotEmpty,
    IsString,
    MaxLength,
    ValidateNested
} from "class-validator";
import { IsOptionalCustom, IsOptionalWithField } from "../../../common/decorators";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";

export class ChannelCreateDto {
    @Expose()
    @IsString()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        example: 'Title of channel'
    })
    @MaxLength(2000)
    share_title: string;

    @Expose()
    @IsOptionalWithField('share_title')
    @ApiPropertyOptional({
        example: 'Title of channel'
    })
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

    @IsString()
    @IsNotEmpty()
    @Transform(TRIM_STRING_TRANSFORMER)
    @Expose()
    @ApiPropertyOptional({
        example: ''
    })
    @IsString()
    @IsNotEmpty()
    @Transform(TRIM_STRING_TRANSFORMER)
    @Expose()
    @ApiPropertyOptional({
        example: ''
    })
    @MaxLength(2000)
    @IsOptionalCustom()
    room_url: string;

    @ApiPropertyOptional({
        example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
    })
    @IsString()
    @IsOptionalCustom()
    @Expose()
    ref?: string;

    @IsIn([0, 1])
    @IsOptionalCustom()
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

    created_date: any;
    updated_date: any;
}

export class ChannelCreateDtos {
    @ApiProperty({
        type: [ChannelCreateDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: ChannelCreateDto[];
    errors: any[];
}
