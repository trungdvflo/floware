import { getRepository, Repository } from 'typeorm';
import { User } from '../../entities/mail/user.entity';
export interface UserServiceOptions {
  fields: (keyof User)[];
}
export class MailUserService {
  private readonly user: Repository<User>;
  constructor() {
    this.user = getRepository(User, 'mail');
  }
  /**
   * Delete items by user name
   * @param username
   * @returns
   */
  updateByUserName(username: string, disabled: number) {
    return this.user.update({ username }, { disabled });
  }
  /**
   * @param username
   * @returns
   */
  deleteByUserName(username: string) {
    return this.user.delete({ username });
  }
}