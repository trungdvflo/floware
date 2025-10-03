import { getRepository } from 'typeorm';
import { File } from '../entities/file.entity';

export class FileService {
  private readonly file = getRepository(File);

  async findSumByUserId(userId: number) {
    return this.file
      .createQueryBuilder('file')
      .select('SUM(file.size)', 'size')
      .where('file.user_id = :id', { id: userId })
      .getRawOne();
  }

  /**
   * Delete cloud storage by user id
   * @param userId
   * @returns
   */
  deleteByUserId(userId: number) {
    return this.file.delete({ user_id: userId });
  }
}
