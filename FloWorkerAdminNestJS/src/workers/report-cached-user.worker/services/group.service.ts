import { getRepository } from 'typeorm';
import { Group } from '../entities/group.entity';

export interface GroupServiceOptions {
  fields: (keyof Group)[];
}
export class GroupService {
  private readonly group = getRepository(Group);

  /**
   * Get third party account
   * @param userId
   * @returns
   */
  findAllByGroupIdList(ListId: number[], options: GroupServiceOptions) {
    if (!ListId.length) return [];
    return this.group
      .createQueryBuilder('group')
      .select(options?.fields.map((f) => `group.${f}`))
      .where('group.id IN(:...id)', { id: ListId })
      .getMany();
  }
}
