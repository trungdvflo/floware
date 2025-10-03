import { getRepository, In } from 'typeorm';
import { AddressBookChange } from '../entities/address-book-change.entity';

export class AddressBookChangeService {
  private readonly repo = getRepository(AddressBookChange);

  /**
   * Delete items by address book id
   * @param listId
   * @returns
   */
  deleteByAddressBookId(listId: number[]) {
    return this.repo.delete({
      addressbookid: In(listId)
    });
  }
}
