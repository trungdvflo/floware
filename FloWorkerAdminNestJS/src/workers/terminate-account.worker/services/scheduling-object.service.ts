import { getRepository } from 'typeorm';
import { SchedulingObject } from '../entities/scheduling-object.entity';

export class SchedulingObjectService {
  private readonly repo = getRepository(SchedulingObject);

  /**
   * Delete items by principaluri
   * @param principaluri
   * @returns
   */
  deleteByUserId(principaluri: string) {
    return this.repo.delete({ principaluri });
  }
}
