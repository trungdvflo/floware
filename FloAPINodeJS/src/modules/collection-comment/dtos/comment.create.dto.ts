import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsDefined, IsEnum, IsInt, IsNotEmpty, IsNumber,
    IsPositive, IsString, ValidateIf, ValidateNested
} from "class-validator";
import { OBJECT_SHARE_ABLE } from "../../../common/constants";
import {
    IsCommentObjectUid, IsOptionalCustom, IsValidateMention
} from "../../../common/decorators";
import { GeneralObjectId } from "../../../common/dtos/object-uid";
import {
    OBJECT_UID_TRANSFORMER
} from '../../../common/transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
import { CommentMentionDto } from "./comment.mention.dto";
export class CreateCommentDto {
    @IsPositive()
    @Expose()
    @IsInt()
    @ApiProperty({
        example: 123
    })
    @IsDefined()
    collection_id: number;

    @ApiPropertyOptional({
        example: "4bab9469-f06c-4508-a857-b7b4df4df42f"
    })
    @IsCommentObjectUid()
    @Expose()
    @Transform(OBJECT_UID_TRANSFORMER)
    @IsDefined()
    object_uid: GeneralObjectId;

    @IsNotEmpty()
    @ApiProperty({
        example: "VTODO"
    })
    @IsString()
    @Expose()
    @IsEnum(OBJECT_SHARE_ABLE)
    @IsDefined()
    object_type: OBJECT_SHARE_ABLE;

    @IsPositive()
    @Expose()
    @IsNumber()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        description: "Comment time from client",
        example: 1670482750.042
    })
    action_time: number;

    @IsString()
    @Expose()
    @ApiProperty({
        description: "Content comment submit by client",
        example: 'This is a comment'
    })
    @IsNotEmpty()
    @IsOptionalCustom()
    @Transform(TRIM_STRING_TRANSFORMER)
    @IsValidateMention()
    comment: string;

    @Expose()
    @IsInt()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        description: "Id parent comment (using for reply comment)",
        example: 167
    })
    parent_id: number;
    created_date: number;
    updated_date: number;

    @ApiPropertyOptional({
        example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
    })
    @IsString()
    @IsOptionalCustom()
    @Expose()
    ref?: string;

    @ApiPropertyOptional({
        description: "mention_text and email, using for mention someone in the comment",
        example: { mention_text: '@anph', email: 'anph@flomail.net' }
    })
    @IsOptionalCustom()
    @ValidateIf((o) => o.mentions?.length)
    @IsArray()
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => CommentMentionDto)
    mentions?: CommentMentionDto[] | null;
}

export class CreateCommentDtos {
    @ApiProperty({
        type: [CreateCommentDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: CreateCommentDto[];
    errors: any[];
}