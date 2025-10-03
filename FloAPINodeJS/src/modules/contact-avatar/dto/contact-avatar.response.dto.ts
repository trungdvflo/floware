import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";

export class ContactAvatarResponseDTO {
    @Expose()
    @IsString()
    @Type(() => String)
    @ApiProperty({
        description: 'A text string. This is the contact avatar download link.',
        required: true
    })
    public avatarUrl: string;
    @Expose()
    @IsString()
    @Type(() => String)
    @ApiProperty({
        description: 'A number. This http code.',
        required: true
    })
    public code?: number;
    @Expose()
    @IsOptionalCustom()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        description: 'A json object. This is the error object contain message error.',
        required: true
    })
    public error?: { message: string };
}