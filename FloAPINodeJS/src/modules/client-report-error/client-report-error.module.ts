import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientReportErrorController } from './client-report-error.controller';
import { ClientReportErrorService } from './client-report-error.service';

@Module({
  imports: [
    ConfigModule
  ],
  controllers: [ClientReportErrorController],
  providers: [ClientReportErrorService],
  exports: [],
})
export class ClientReportErrorModule { }