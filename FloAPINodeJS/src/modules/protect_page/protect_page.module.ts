import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { ProtectPageRepository } from '../../common/repositories/protect_page.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { ProtectPageController } from './protect_page.controller';
import { ProtectPageService } from './protect_page.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      ProtectPageRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    LoggerModule

  ],
  controllers: [ProtectPageController],
  providers: [ProtectPageService],
  exports: [ProtectPageService],
})
export class ProtectPageModule { }