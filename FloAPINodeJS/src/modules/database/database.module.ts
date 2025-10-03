import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import cfgSQL from '../../configs/sql';
import { DatabaseUtilitiesService } from './database-utilities.service';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(cfgSQL)],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => await configService.get('database')
    }),
  ],
  providers: [DatabaseUtilitiesService],
  exports: [DatabaseUtilitiesService]
})

export class DatabaseModule {}