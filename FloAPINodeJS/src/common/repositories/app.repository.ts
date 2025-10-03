import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { AppRegister } from '../entities/app.register.entity';

@Injectable()
@CustomRepository(AppRegister)
export class AppRegisterRepo extends Repository<AppRegister> {
  // implement custom method here
  ping(pq: string) {
    return this.count({
      where: [{ app_reg_id: pq }, { app_alias: pq }],
      cache: true
    });
  }
}
