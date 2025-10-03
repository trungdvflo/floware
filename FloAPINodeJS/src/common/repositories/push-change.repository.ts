import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { PushChange } from '../entities/push-change.entity';

@Injectable()
@CustomRepository(PushChange)
export class PushChangeRepository extends Repository<PushChange> {
  async insertEntity(userId: number, pushedTime: number) {
    const existedEntity = await this.findOne({
      select: ['id'],
      where: {
        user_id: userId
      }
    });
    if (!existedEntity) {
      this.insert(this.create({
        created_date: pushedTime,
        user_id: userId
      }));
    }
  }
}
