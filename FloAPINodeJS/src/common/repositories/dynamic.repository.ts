import { MoreThan, Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { DynamicKey } from '../entities/dynamic-key.entity';

// DynamicKey Repository
@CustomRepository(DynamicKey)
export class DynamicKeyRepo extends Repository<DynamicKey> {
  // implement custom method here
  async AesEncrypted(): Promise<any> {
    const { public_key, updated_date } = await this.findOne({
      where: { id: MoreThan(0)},
      cache: true
    });
    return {
      pkey: public_key,
      updated_date
    };
  }
}
