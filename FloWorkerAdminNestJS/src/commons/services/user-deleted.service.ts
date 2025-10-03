import { getRepository, LessThanOrEqual, In, LessThan, MoreThan, Between } from 'typeorm';
import { DEL_USER_PROGRESS } from '../../workers/terminate-account.worker/constant';
import { UserDeleted } from '../entities/user-deleted.entity';

export interface UserDeletedServiceOptions {
  fields: (keyof UserDeleted)[];
  take?: number;
}
export class UserDeletedService {
  private readonly repo = getRepository(UserDeleted);
  /**
   * Find one by user id
   * @param userId
   * @param options
   * @returns
   */
  findOneByUserId(userId: number, options: UserDeletedServiceOptions) {
    return this.repo.findOne({
      select: options?.fields,
      where: { user_id: userId },
      order: { id: 'DESC' }
    });
  }

  /**
   * Find all user for delete
   * @param options
   * @returns
   */
  findAll4Delete(options: UserDeletedServiceOptions) {
    const now = Date.now() / 1000;

    return this.repo.find({
      select: options?.fields,
      where: {
        cleaning_date: Between(1, now),
        progress: In([DEL_USER_PROGRESS.not_yet])
      },
      take: options?.take,
    });
  }

  /**
   * update progress user deleted
   * @param id
   * @param progress
   * @returns
   */
  updateProgressByUserId(id: number, progress: number) {
    return this.repo.update(
      {
        user_id: id
      },
      { progress }
    );
  }
}
