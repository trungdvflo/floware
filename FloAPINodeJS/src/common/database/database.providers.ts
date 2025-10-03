import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource(configService.get('database'));
      return dataSource.initialize();
    },
    inject: [ConfigService]
  },
];