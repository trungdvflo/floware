import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_APPREG_TAKEN, MSG_FIND_NOT_FOUND } from '../../../common/constants/message.constant';
import { CreatePlatformSettingDto } from './create-platform-setting.dto';
import { IPlatformSettingDto } from './platform-setting.dto';
import { UpdatePlatformSettingDto } from './update-platform-setting.dto';

const PLATFORM_SETTING_ATTB_ERR = {
    app_version: '1.2.0',
    app_reg_id: ''
};

export const PLATFROM_SETTING_400_ERROR = {
    error:{
        attributes: PLATFORM_SETTING_ATTB_ERR,
        message: `${MSG_APPREG_TAKEN}`,
        code: ErrorCode.PLATFORM_SETTING_TAKEN
      }
};

export const PLATFROM_SETTING_400_INVALID_ERROR = {
    error: {
        code: 'badRequest',
        message: 'data.data_setting payload invalid'
    }
};

export const PLATFROM_SETTING_404_ERROR = {
    error:{
        attributes: PLATFORM_SETTING_ATTB_ERR,
        message: `${MSG_FIND_NOT_FOUND} 1.2.0`,
        code: ErrorCode.PLATFORM_SETTING_NOT_FOUND
      }
};
export class ReqCreateDto {
    @ApiProperty({
        example: {
            app_version: '1.0.1',
            data_setting: {
                show_setting: 1,
                confirm_delete: 1
            }
        }
    })
    @IsObject()
    @ValidateNested()
    @Type(() => CreatePlatformSettingDto)
    data: CreatePlatformSettingDto;
}

export class ReqUpdateDto {
    @ApiProperty({
        example: {
            id: 1,
            app_version: '1.0.1',
            data_setting: {
                show_setting: 1,
                confirm_delete: 1
            }
        }
    })
    @IsObject()
    @ValidateNested()
    @Type(() => UpdatePlatformSettingDto)
    data: UpdatePlatformSettingDto;
}

export class RespDto {

    @ApiProperty({
        example: {
            id: 1,
            data_setting: {
                show_setting: 1,
                confirm_delete: 1
            },
            app_version: "1.0.1",
            created_date: 1617855800.535,
            updated_date: 1617874999.7
        }
    })
    private readonly data: IPlatformSettingDto = new IPlatformSettingDto();
    // dto data return user
    constructor(partial?: Partial<IPlatformSettingDto>) {
        Object.assign(this.data, partial);
    }
}
