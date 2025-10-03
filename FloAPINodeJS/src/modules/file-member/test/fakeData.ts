import { datatype } from 'faker';
import { FileAttachment } from '../../../common/entities/file-attachment.entity';
import { DeleteFileDTO } from '../dtos/file-member-delete.dto';

export function fakeFileMember(): Partial<FileAttachment> {
  return {
    id: datatype.number(),
    user_id: datatype.number(),
    uid: datatype.string(),
    local_path: datatype.string(),
    source: datatype.number(),
    filename: datatype.string(),
    ext: datatype.string(),
    object_uid: datatype.string(),
    object_type: datatype.string(),
    client_id: datatype.string(),
    size: datatype.number()
  };
}

export function fakeDeleteFileDTO(): DeleteFileDTO {
  return {
    uid: datatype.string(),
    collection_id: datatype.number()
  };
}