import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject, IsObject, IsString } from 'class-validator';
import { formatMessageInvalid } from '../../../common/utils/common';
import { IPlatformSettingDto } from './platform-setting.dto';
export class CreatePlatformSettingDto extends PartialType(IPlatformSettingDto) {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    app_version: string;

    @ApiProperty()
    @IsObject({
        message: formatMessageInvalid
    })
    @IsNotEmpty({
        message: formatMessageInvalid
    })
    @IsNotEmptyObject({
        nullable: false
    },{
        message: formatMessageInvalid
    })
    data_setting: object;

}
