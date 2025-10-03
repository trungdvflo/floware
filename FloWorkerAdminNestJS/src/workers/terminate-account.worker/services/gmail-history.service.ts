import { getRepository, In } from 'typeorm';
import { GmailHistory } from '../entities/gmail-history.entity';

export class GmailHistoryService {
  private readonly repo = getRepository(GmailHistory);

  /**
   * Delete an item by user id
   * @param listId
   * @returns
   */
  deleteByEmail(listGmail: string[]) {
    return this.repo.delete({ gmail: In(listGmail) });
  }
}
