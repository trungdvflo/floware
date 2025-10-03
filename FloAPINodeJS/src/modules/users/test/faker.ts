import { datatype, internet, lorem, name } from 'faker';
import { Users } from '../../../common/entities/users.entity';

export function fakeUser(): Users {
  return {
    id: datatype.number(),
    email: internet.email(),
    username: name.findName(),
    description: lorem.text(10),
    password: internet.password()
  } as Users;
}

export function fakeUserProfile(): Users {
  return {
    id: datatype.number(),
    birthday: lorem.text(10),
    disabled: datatype.number(),
    gender: datatype.number(),
    role: datatype.number(),
    email: internet.email(),
    description: lorem.text(10),
    fullname: lorem.text(10),
    quota_limit_bytes: datatype.number(),
    updated_date: datatype.number(),
  } as Users;
}
