import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray,
    IsInt, IsNotEmpty, IsPositive, ValidateNested
} from 'class-validator';
import { CreateThirdPartyAccountDto } from './create-third-party-account.dto';
import { IThirdPartyAccountDto } from './third-party-account.dto';
import { UpdateThirdPartyAccountDto } from './update-third-party-account.dto';

export const THIRD_PARTY_ACCOUNT_SAMPLE = {
    "server_income": "1",
    "user_income": "aaa@mgial.com",
    "port_income": "993",
    "use_ssl_income": 1,
    "type_income": 993,
    "server_smtp": "smtp.gmail.com",
    "user_smtp": "vannam1993cse@gmail.com",
    "port_smtp": "465",
    "use_ssl_smtp": 1,
    "auth_type_smtp": 256,
    "server_caldav": "https://apidata.googleusercontent.com",
    "server_path_caldav": "/10314309005/calendars/",
    "port_caldav": "993",
    "use_ssl_caldav": 1,
    "auth_type": 256,
    "account_type": 1,
    "account_sync": {
        "Email": 1,
        "Calendar": 1
    },
    "full_name": "",
    "description": "",
    "icloud_user_id": "",
    "user_caldav": "",
    "email_address": null,
    "signature": ""
};
export class ReqUpdateThirdPartyAccountDto {
    @ApiProperty({
        example: [
            {
                "id": 1,
                ...THIRD_PARTY_ACCOUNT_SAMPLE
            }
        ]
    })
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @Expose()
    data: UpdateThirdPartyAccountDto[];
    errors?: any[];
}

export class ReqCreateThirdPartyAccountDto {
    @ApiProperty({
        example: [THIRD_PARTY_ACCOUNT_SAMPLE]
    })
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @Expose()
    data: CreateThirdPartyAccountDto[];

    errors?: any[];
}
/**
 * delete body for 3rd account
 */
export class Delete3rdAccount {
  @ApiProperty({
    example: 123
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Expose()
  id: number;
}
export class ReqDeleteThirdPartyAccount {
  @ApiProperty({
    type: [Delete3rdAccount]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => Delete3rdAccount)
  data: Delete3rdAccount[];

  public errors: any[];

}

export class RespThirdPartyAccountDto {
    @ApiProperty({
        example:
            [
                {
                    "id": 1,
                    ...THIRD_PARTY_ACCOUNT_SAMPLE
                }
            ]
    })
    @Type(() => IThirdPartyAccountDto)
    private readonly data?: IThirdPartyAccountDto[];
    private readonly error: any;
    // dto data return user
    constructor(partial?: IThirdPartyAccountDto[], errors?: {
        message: string,
        attributes: any
    }[]) {
        if (partial) {
            this.data = partial;
        }
        if (errors && errors.length > 0) {
            this.error = {errors};
        }
    }
}