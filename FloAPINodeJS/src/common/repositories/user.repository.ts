import { Injectable } from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { Users } from '../entities';

@Injectable()
@CustomRepository(Users)
export class UsersRepository extends Repository<Users> {

  async disableUserAndReport(userId: number, updatedDate: number): Promise<UpdateResult>{
    await this.manager.query(`UPDATE report_cached_user
    SET disabled = 1, updated_date = ?
    WHERE user_id = ?`, [updatedDate, userId]);

    return this.update({ id: userId }, {
      disabled: 1,
      updated_date: updatedDate
    });
  }
}
