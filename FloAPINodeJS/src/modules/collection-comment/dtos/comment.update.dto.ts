import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsInt, IsNotEmpty, IsNumber,
    IsPositive, IsString,
    ValidateIf,
    ValidateNested
} from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
import { CommentMentionDto } from "./comment.mention.dto";

export class UpdateCommentDto {
    @IsPositive()
    @Expose()
    @IsInt()
    @ApiProperty({
        example: 123
    })
    id: number;

    @IsString()
    @Expose()
    @ApiProperty({
        description: "Content comment submit by client",
        example: 'This is a comment'
    })
    @IsNotEmpty()
    @IsOptionalCustom()
    @Transform(TRIM_STRING_TRANSFORMER)
    // @IsValidateMention()
    comment: string;

    @IsPositive()
    @Expose()
    @IsNumber()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        description: "Comment time from client",
        example: 1670482750.042
    })
    action_time: number;

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

    updated_date: any;
}

export class UpdateCommentDtos {
    @ApiProperty({
        type: [UpdateCommentDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: UpdateCommentDto[];
    errors: any[];
}
