import { getRepository } from 'typeorm';
import { Admin } from '../entities/admin.entity';

export class AdminService {
  private readonly repo = getRepository(Admin);

  /**
   * Delete admin user by email
   * @param userId
   * @returns
   */
  deleteByEmail(email: string) {
    return this.repo.delete({ email });
  }
}
