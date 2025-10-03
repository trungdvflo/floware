import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ReqUserProfileDto, ResUserProfileDto } from "./users-profile.dto";

export class ReqUpdateUserProfileDto {
    @ApiProperty({
        example: {
            "fullname": "Nguyen Van A",
            "description": "Description of flo account",
            "birthday": "110986d9200",
            "gender": 0
        }
    })

    @ValidateNested()
    @Type(() => ReqUserProfileDto)
    data: ReqUserProfileDto;
}

export class CheckEmailDTO {
    @ApiProperty({
        required: true,
        description: 'An email that needs to check to exist'
    })
    email: string;
}
export class ResUpdateUserProfileDto {
    @ApiProperty({
        example: {
            "email": "nguyenvana@flomail.net",
            "fullname": "Nguyen Van A",
            "description": "Description of flo account",
            "birthday": "110986d9200",
            "gender": 0,
            "quota_limit_bytes": 0,
            "disabled": 0,
            "updated_date": 1619428034.369
        }
    })

    @ValidateNested()
    @Type(() => ReqUserProfileDto)
    data: ResUserProfileDto;
}