import { getRepository } from 'typeorm';
import { Principal } from '../entities/principal.entity';

export class PrincipalService {
  private readonly repo = getRepository(Principal);

  /**
   * Delete admin user by email
   * @param userId
   * @returns
   */
  deleteByEmail(email: string) {
    return this.repo.delete({ email });
  }
}
