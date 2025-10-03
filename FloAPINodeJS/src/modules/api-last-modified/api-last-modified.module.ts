import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { ApiLastModifiedRepository } from '../../common/repositories/api-last-modified.repository';
import { QuotaRepository } from '../../common/repositories/quota.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { ApiLastModifiedController } from './api-last-modified.controller';
import { ApiLastModifiedService } from './api-last-modified.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmExModule.forCustomRepository([
      ApiLastModifiedRepository,
      QuotaRepository
    ]),
    LoggerModule
  ],
  controllers: [ApiLastModifiedController],
  providers: [ApiLastModifiedService]
})
export class ApiLastModifiedModule {}