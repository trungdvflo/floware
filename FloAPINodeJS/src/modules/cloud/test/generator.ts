import { datatype } from 'faker';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { Cloud } from '../../../common/entities/cloud.entity';
import { CreateCloudDTO } from '../dtos/create-cloud.dto';
import { UpdateCloudDTO } from '../dtos/update-cloud.dto';

export function fakeGetCloud(): BaseGetDTO {
  return {
    page_size: 10,
  };
}

export function fakeCloud(): Partial<Cloud> {
  return {
    id: datatype.number(),
    user_id: datatype.number(),
    uid: datatype.string(),
    real_filename: datatype.string(),
    ext: datatype.string(),
    device_uid: datatype.string(),
    bookmark_data: datatype.string(),
    upload_status: datatype.number(),
    size: datatype.number()
  };
}

export function fakeCreatedCloud(): Partial<CreateCloudDTO>[] {
  const dataMockup = [
    {
      real_filename: datatype.string(),
      ext: datatype.string(),
      device_uid: datatype.string(),
      bookmark_data: datatype.string(),
      size: datatype.number()
    }
  ];
  return dataMockup;
}

export function fakeUpdateCloud(): Partial<UpdateCloudDTO>[] {
  const dataMockup = [
    {
      id: datatype.number(),
      real_filename: datatype.string(),
      ext: datatype.string(),
      device_uid: datatype.string(),
      bookmark_data: datatype.string(),
      size: datatype.number()
    }
  ];
  return dataMockup;
}
