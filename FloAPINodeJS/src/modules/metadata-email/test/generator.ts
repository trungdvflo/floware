import { datatype, internet } from 'faker';
import { OBJ_TYPE } from '../../../common/constants/common';
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { EmailObjectPlain, ObjectId } from '../../../common/dtos/object-uid';
import { MetadataEmail } from '../../../common/entities/metadata-email.entity';
import { CreateMetadataEmailDTO } from '../dtos/create-metadata-email.dto';
import { UpdateMetadataEmailDTO } from '../dtos/update-metadata-email.dto';

export function fakeFilter(): GetAllFilter<MetadataEmail> {
  return {
    page_size: 10,
  };
}

export function fakeEntity(): Partial<MetadataEmail> {
  return {
    id: datatype.number(),
    account_id: datatype.number(),
    from: [{ email: internet.email() }],
    to: [{ email: internet.email() }],
    cc: [{ email: internet.email() }],
    bcc: [{ email: internet.email() }],
    object_uid: {
      path: datatype.string(),
      uid: datatype.number(),
    },
    object_type: OBJ_TYPE.EMAIL,
    object_uid_buf: Buffer.from(''),
    snippet: datatype.string(),
    subject: datatype.string(),
    user_id: datatype.number(),
    received_date: datatype.number(),
    sent_date: datatype.number(),
    created_date: datatype.number(),
    updated_date: datatype.number()
  };
}

export function fakeCreatedDTO(): CreateMetadataEmailDTO {
  return {
    account_id: datatype.number(),
    from: [{ email: internet.email() }],
    to: [{ email: internet.email() }],
    cc: [{ email: internet.email() }],
    bcc: [{ email: internet.email() }],
    object_uid: ObjectId.ObjectIdFactory(new EmailObjectPlain({
      path: datatype.string(),
      uid: datatype.number(),
    }), OBJ_TYPE.EMAIL),
    object_type: OBJ_TYPE.EMAIL,
    snippet: datatype.string(),
    subject: datatype.string(),
    received_date: datatype.number(),
    sent_date: datatype.number(),
    message_id: datatype.string()
  };
}

export function fakeUpdateDTO(): UpdateMetadataEmailDTO {
  return {
    id: datatype.number(),
    account_id: datatype.number(),
    from: [{ email: internet.email() }],
    to: [{ email: internet.email() }],
    cc: [{ email: internet.email() }],
    bcc: [{ email: internet.email() }],
    object_uid: ObjectId.ObjectIdFactory(new EmailObjectPlain({
      path: datatype.string(),
      uid: datatype.number(),
    }), OBJ_TYPE.EMAIL),
    object_type: OBJ_TYPE.EMAIL,
    snippet: datatype.string(),
    subject: datatype.string(),
    received_date: datatype.number(),
    sent_date: datatype.number(),
    message_id: datatype.string()
  };
}