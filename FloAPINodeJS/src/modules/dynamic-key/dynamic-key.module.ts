import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
// our
import { LoggerModule } from '../../common/logger/logger.module';
import { AppRegisterRepo } from '../../common/repositories/app.repository';
import { DynamicKeyRepo } from '../../common/repositories/dynamic.repository';
import { DynamicKeyController } from './dynamic-key.controller';
import { DynamicKeyService } from './dynamic-key.service';
@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      DynamicKeyRepo,
      AppRegisterRepo
    ]),
    LoggerModule
  ],
  controllers: [DynamicKeyController],
  providers: [DynamicKeyService]
})
export class DynamicKeyModule {}