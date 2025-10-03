import { Group } from '../../workers/report-cached-user.worker/entities/group.entity';
import { getRepository } from 'typeorm';
import { GroupsUser } from '../entities/group-user.entity';

export interface GroupUserServiceOptions {
  fields: (keyof GroupsUser)[];
}
export class GroupUserService {
  private readonly groupUser = getRepository(GroupsUser);

  /**
   * Get third party account
   * @param userId
   * @returns
   */
  findAllByUserId(userId: number, options: GroupUserServiceOptions) {
    return this.groupUser.find({
      select: options?.fields,
      where: { user_id: userId },
      order: { id: 'DESC' }
    });
  }

  /**
   * Delete cloud storage by user id
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.groupUser.delete({ user_id: userId });
  }

  getAllGroupsByUserId(userId: number) {
    if (!userId) return [];
    return this.groupUser.createQueryBuilder('gu')
      .select(["gg.id as id", "gg.name as name", "gg.description as description",
        "gg.group_type as group_type", "gg.created_date as created_date", "gg.updated_date as updated_date"])
      .innerJoin(Group, 'gg', 'gg.id = gu.group_id')
      .where('gu.user_id = :userId', { userId })
      .getRawMany();
  }
}
