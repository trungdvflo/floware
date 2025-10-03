import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";

export class ContactAvatarGetDTO {
    @Expose()
    @IsString()
    @Type(() => String)
    @ApiProperty({
        description: 'A text string. This is the MD5 of user’s email.',
        required: true
    })
    public m: string;

    @Expose()
    @IsString()
    @Type(() => String)
    @ApiProperty({
        description: 'A text string. This is the URI of the card.',
        required: true
    })
    public u: string;

    @Expose()
    @IsOptionalCustom()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        description: 'A number. This is the ID of table address books',
        required: true
    })
    public ad: number;

    @Expose()
    @IsOptionalCustom()
    @IsNumber()
    @Type(() => Number)
    @IsOptionalCustom()
    @ApiProperty({
        description: 'A number. This is time change contact avatar',
        required: true
    })
    public tm?: string;

}