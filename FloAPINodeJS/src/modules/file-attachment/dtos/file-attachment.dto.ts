import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Equals, IsNotEmpty, IsString } from 'class-validator';
import { OBJ_TYPE } from "../../../common/constants";
import { IsOptionalCustom } from '../../../common/decorators';
export class CreateFileDTO {
  @ApiProperty({
    type: 'file',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Binary file'
  })
  @Expose()
  file: any;

  @IsString()
  @ApiProperty({ description: 'uid of caldav (current only support VJOURNAL),...'})
  @Expose()
  object_uid: string;

  @IsString()
  @Equals(OBJ_TYPE.VJOURNAL)
  @ApiProperty({ description: 'only VJOURNAL'})
  @Expose()
  object_type: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty({ required:false, description: `Rule & description: <br> \
    - File name - store on server, it is unique and auto generate UID  <br> \
    - Note:  <br> \
        * if uid is blank, it will auto create new record.  <br> \
        * Otherwise, data will be update with this ui.`
  })
  @Expose()
  uid: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty({ required:false, description: 'store local path of file'})
  @Expose()
  local_path: string;

  @IsString()
  @IsNotEmpty()
  @IsOptionalCustom()
  @ApiProperty({ required:false, description: 'Store client id of item from client app'})
  @Expose()
  client_id: string;

  @IsOptionalCustom()
  @ApiProperty({ required: false})
  @Expose()
  ref: string | number;
}
