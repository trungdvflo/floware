import { getRepository, Repository } from 'typeorm';

import { User } from '../entities/user.entity';

export interface UserServiceOptions {
  fields: (keyof User)[];
}
export class UserService {
  private readonly userRepository: Repository<User>;
  constructor() {
    this.userRepository = getRepository(User);
  }

  getUsersJoinReport() {
    return this.userRepository
      .createQueryBuilder('u')
      .select(['u.id AS id'])
      // .leftJoin(ReportCachedUser, 'r', 'r.user_id = u.id')
      // .where('r.user_id IS NULL')
      .execute();
  }

  getUserById(userId: number, options?: UserServiceOptions) {
    return this.userRepository.findOne({
      select: options?.fields,
      where: { id: userId }
    });
  }

  getUserByEmail(email: string, options?: UserServiceOptions) {
    return this.userRepository.findOne({
      select: options?.fields,
      where: { email }
    });
  }

  /**
   * Delete items by user_id
   * @param userId
   * @returns
   */
  deleteById(userId: number) {
    return this.userRepository.delete({ id: userId });
  }


  /**
 * Get all access token
 * @param userId
 * @returns
 */
  getAllPlatform(userId: number) {
    return this.userRepository.createQueryBuilder('usr')
      .select(['ar.app_reg_id', 'ar.app_name'])
      .innerJoin('access_token', 'ac', 'ac.user_id = usr.id')
      .innerJoin('app_register', 'ar', 'ac.app_id = ar.app_reg_id')
      .where({ id: userId })
      .groupBy('ac.user_id, ar.app_reg_id')
      .getRawMany();
  }
}