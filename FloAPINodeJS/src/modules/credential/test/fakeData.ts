import { datatype } from 'faker';
import { CredentialEntity } from '../../../common/entities/credential.entity';
import { CredentialDTO } from '../dto/credential.post.dto';
import { CredentialUpdateDTO } from '../dto/credential.put.dto';

export function fakeEntity(
  condition = 1,
  operator = 2,
  action = 1,
  value = "example",
  destinationValue = "move_to_imap_folder"
): Partial<CredentialEntity> {
  return {
    id: datatype.number(),
    user_id: 1,
    data_encrypted: datatype.string(),
    type: 0,
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeCreatedDTO(): CredentialDTO {
  return {
    data_encrypted: datatype.string(),
    type: 0,
    ref: datatype.string()
  };
}

export function fakeUpdatedDTO(): CredentialUpdateDTO {
  return {
    id: datatype.number(),
    data_encrypted: datatype.string(),
    type: 0,
  };
}