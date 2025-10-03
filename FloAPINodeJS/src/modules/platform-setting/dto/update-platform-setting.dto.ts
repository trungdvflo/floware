import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsString } from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { formatMessageInvalid } from '../../../common/utils/common';
import { IPlatformSettingDto } from './platform-setting.dto';

export class UpdatePlatformSettingDto extends PartialType(IPlatformSettingDto) {

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty()
    id: number;

    @ApiProperty({
        required: true
    })
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    app_version: string;

    @ApiProperty({
        required: true
    })
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

    @IsOptionalCustom()
    updated_date: number;
}
