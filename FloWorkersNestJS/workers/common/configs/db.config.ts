import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  retryAttempts: process.env.RETRY || 15,
  type: 'mysql',
  host: process.env.MYSQL_HOST_NAME,
  port: +process.env.MYSQL_HOST_PORT || 3306,
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_MAIN_DB,
  logging: process.env.NODE_ENV !== 'production' ? true : false,
  extra: {
    connectionLimit: +process.env.DB_MAX_POOL || 100,
    bigNumberStrings: false,
    charset: 'utf8mb4_unicode_ci'
  },
  ssl: String(process.env.DB_SSL).toLowerCase() === 'true',
  entities: [
    __dirname + './models/*.entity{.ts,.js}',
    __dirname + '../../../**/models/*.entity{.ts,.js}'
  ]
}));