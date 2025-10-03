import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import {
    IsEmail,
    IsNotEmpty,
    IsString
} from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
export class CommentMentionDto {

    @IsString()
    @ApiProperty({
        description: "Email of user has mentioned",
        example: 'anph@flomail.net'
    })
    @IsNotEmpty()
    @IsEmail()
    @Transform(TRIM_STRING_TRANSFORMER)
    @Expose()
    email: string;

    @IsString()
    @ApiProperty({
        description: "the @tag is used to mention someone in the shared collection.",
        example: '@anph'
    })
    @IsNotEmpty()
    @Transform(TRIM_STRING_TRANSFORMER)
    @Expose()
    // @IsValidateMentionText()
    @IsOptionalCustom()
    mention_text: string;
}