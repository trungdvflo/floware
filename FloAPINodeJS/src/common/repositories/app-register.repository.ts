import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { AppRegister } from '../entities/app-register.entity';

@Injectable()
@CustomRepository(AppRegister)
export class AppRegisterRepository extends Repository<AppRegister> {

}
