import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    ValidateNested
} from "class-validator";
import { EmailDTO } from "../../../common/dtos/email.dto";

export class CheckChannelDto {
    @ArrayMinSize(1)
    @Type(() => EmailDTO)
    @ValidateNested({ each: true })
    @Expose()
    @IsArray()
    participants: EmailDTO[];
}
export class CheckChannelDtos {
    @IsNotEmpty()
    @ApiProperty({ type: CheckChannelDto })
    @ValidateNested()
    @Type(() => CheckChannelDto)
    @Expose()
    data: CheckChannelDto;

    errors: any[];
}
