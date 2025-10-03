import { getRepository, In } from 'typeorm';
import { Card } from '../entities/card.entity';

export interface CardServiceOptions {
  fields: (keyof Card)[];
}
export class CardService {
  private readonly card = getRepository(Card);

  async findByAddressBookid(listID: number[], options: CardServiceOptions) {
    if (!listID.length) return [];
    return this.card
      .createQueryBuilder('cards')
      .select(options?.fields.map((f) => `cards.${f}`))
      .addSelect('SUM(cards.size)', 'size')
      .where('cards.addressbookid IN(:...uri)', { uri: listID })
      .groupBy(options?.fields.map((f) => `cards.${f}`).toString())
      .getRawOne();
  }

  async calcSizeContact(addressBookIds: number[]) {
    if (!addressBookIds.length) {
      return { size: 0 }
    }
    return await this.card
      .createQueryBuilder('cards')
      .select('IFNULL(SUM(cards.size),0)', 'size')
      .where('cards.addressbookid IN(:...uri)', { uri: addressBookIds })
      .getRawOne();
  }
  /**
   * Delete an item by user id
   * @param listId
   * @returns
   */
  deleteByAddressBookId(listId: number[]) {
    return this.card.delete({ addressbookid: In(listId) });
  }
}
