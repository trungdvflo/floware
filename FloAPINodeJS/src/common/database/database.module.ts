import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import cfgSQL from '../../configs/sql';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(cfgSQL)],
      inject: [ConfigService],
      useFactory: async  (configService: ConfigService) => configService.get('database')
    }),
  ],
})

export class DatabaseModule {}