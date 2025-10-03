import { getRepository } from 'typeorm';
import { AddressBooks } from '../entities/address-books.entity';

export interface AddressBooksServiceOptions {
  fields: (keyof AddressBooks)[];
}
export class AddressBooksService {
  private readonly addressbooks = getRepository(AddressBooks);

  findAllByPrincipal(principaluri, options: AddressBooksServiceOptions) {
    return this.addressbooks.find({
      select: options?.fields,
      where: { principaluri }
    });
  }

  /**
   * Delete items by address book id
   * @param listId
   * @returns
   */
  deleteById(listId: number[]) {
    return this.addressbooks.delete(listId);
  }
}
