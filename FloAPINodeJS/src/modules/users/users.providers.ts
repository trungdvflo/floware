import { Users } from '../../common/entities/users.entity';

export const UserProviders = [
  {
    provide: 'UserRepository',
    useValue: Users
  },
];