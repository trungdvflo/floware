import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { DynamicKey } from '../../common/entities/dynamic-key.entity';

@Injectable()
export class MonitorService {
  constructor (
    @InjectRepository(DynamicKey)
    private readonly dynamicKeyRepo: Repository<DynamicKey>
    ){}

  async getUser() {
    return await this.dynamicKeyRepo.findOne({
      where: { id: MoreThan(0)},
      select:['id']
    });
  }

}
