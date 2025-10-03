import { datatype, internet } from 'faker';
import { OBJ_TYPE } from '../../../common/constants/common';
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { EmailObjectPlain, ObjectId } from '../../../common/dtos/object-uid';
import { Tracking } from '../../../common/entities/tracking.entity';
import { CreateTrackingDTO } from '../dtos/create-tracking.dto';
import { UpdateTrackingDTO } from '../dtos/update-tracking.dto';

export function fakeFilter(): GetAllFilter<Tracking> {
  return {
    page_size: 10,
  };
}

export function fakeTracking(): Partial<Tracking> {
  return {
    id: datatype.number(),
    account_id: datatype.number(),
    message_id: datatype.string(),
    emails: [{ email: internet.email() }],
    object_uid: {
      path: datatype.string(),
      uid: datatype.number(),
    },
    object_type: OBJ_TYPE.EMAIL,
    object_uid_buf: Buffer.from(''),
    status: datatype.number(),
    subject: datatype.string(),
    user_id: datatype.number(),
    created_date: datatype.number(),
    replied_time: datatype.number(),
    time_send: datatype.number(),
    time_tracking: datatype.number(),
    updated_date: datatype.number()
  };
}

export function fakeCreatedTracking(): CreateTrackingDTO {
  return {
    account_id: datatype.number(),
    message_id: datatype.string(),
    emails: [{ email: internet.email() }],
    object_uid: ObjectId.ObjectIdFactory(new EmailObjectPlain({
      path: datatype.string(),
      uid: datatype.number(),
    }), OBJ_TYPE.EMAIL),
    object_type: OBJ_TYPE.EMAIL,
    status: datatype.number(),
    subject: datatype.string(),
    replied_time: datatype.number(),
    time_send: datatype.number(),
    time_tracking: datatype.number(),
  };
}

export function fakedUpdateEntity(): UpdateTrackingDTO {
  return {
    id: datatype.number(),
    message_id: datatype.string(),
    account_id: datatype.number(),
    emails: [{ email: internet.email() }],
    object_uid: ObjectId.ObjectIdFactory(new EmailObjectPlain({
      path: datatype.string(),
      uid: datatype.number(),
    }), OBJ_TYPE.EMAIL),
    object_type: OBJ_TYPE.EMAIL,
    status: datatype.number(),
    subject: datatype.string(),
    replied_time: datatype.number(),
    time_send: datatype.number(),
    time_tracking: datatype.number(),
  };
}