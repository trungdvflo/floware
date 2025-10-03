import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LastModifyRepository } from '../../repository/api-last-modify.repository';
import { PushChangeRepository } from '../../repository/push-change.repository';
import { TypeORMModule } from '../../utils/typeorm.module';
import { RealTimeService } from '../communication/services';
import { CommonApiLastModifiedService } from './api-last-modify-common.service';
@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('worker.realTimeSecret'),
        signOptions: { expiresIn: configService.get<string>('worker.realTimeExpiredToken') }
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    TypeORMModule.forCustomRepository([
      LastModifyRepository,
      PushChangeRepository
    ]),
  ],
  providers: [
    CommonApiLastModifiedService,
    RealTimeService
  ],
  exports:[CommonApiLastModifiedService, RealTimeService]
})
export class ApiLastModifiedCommonModule {}
