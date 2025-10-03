import { VirtualAlias } from '../../entities/mail/virtual-alias.entity';
import { getRepository } from 'typeorm';

export class MailVirtualAliasService {
  private readonly repo = getRepository(VirtualAlias, 'mail');

  /**
   * Delete items by user name
   * @param username
   * @returns
   */
  deleteByUserName(username: string) {
    return this.repo.delete({ source: username });
  }
}
