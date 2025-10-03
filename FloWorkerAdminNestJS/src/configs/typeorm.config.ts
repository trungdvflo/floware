import fs from 'fs';
import { join } from 'path';
import appRoot from 'app-root-path';
import { ConnectionOptions, createConnections } from 'typeorm';

export const initDB = () => {
  const {
    // flo db
    MYSQL_MAIN_DB,
    MYSQL_HOST_NAME,
    MYSQL_HOST_PORT,
    MYSQL_USERNAME,
    MYSQL_PASSWORD,
    MYSQL_CERT_PATH,
    MYSQL_USE_SSL,
    // mail db
    MYSQL_MAIL_DB,
    MYSQL_MAIL_HOST,
    MYSQL_MAIL_USERNAME,
    MYSQL_MAIL_PASSWORD,
    MYSQL_MAIL_PORT,
    MYSQL_MAIL_SSL,
    MYSQL_MAIL_MAX_POOL
  } = process.env;

  const defaultConfig: ConnectionOptions = {
    name: 'default',
    type: 'mysql',
    host: MYSQL_HOST_NAME,
    port: Number(MYSQL_HOST_PORT) || 3306,
    username: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: MYSQL_MAIN_DB,
    ssl:
      MYSQL_USE_SSL && (MYSQL_USE_SSL === '1' || MYSQL_USE_SSL.toLowerCase() === 'true')
        ? {
          ca: fs.readFileSync(
            MYSQL_CERT_PATH || `${appRoot}/pem_files/rds-combined-ca-bundle.pem`
          )
        }
        : { rejectUnauthorized: false },
    logging: true,
    entities: [
      join(__dirname, '../workers/**/entities/', '*.entity.{ts,js}'),
      join(__dirname, '../commons/**/entities/', '*.entity.{ts,js}'),
      join(__dirname, '../commons/**/entities/mail', '*.entity.{ts,js}')
    ],
    bigNumberStrings: false,
    extra: {
      connectionLimit: 5
    }
  };

  const mailConfig: ConnectionOptions = {
    name: 'mail',
    type: 'mysql',
    host: MYSQL_MAIL_HOST,
    port: Number(MYSQL_MAIL_PORT) || 3306,
    username: MYSQL_MAIL_USERNAME,
    password: MYSQL_MAIL_PASSWORD,
    database: MYSQL_MAIL_DB,
    ssl:
      MYSQL_MAIL_SSL && (MYSQL_MAIL_SSL === '1' || MYSQL_MAIL_SSL.toLowerCase() === 'true')
        ? {
          ca: fs.readFileSync(
            MYSQL_CERT_PATH || `${appRoot}/pem_files/rds-combined-ca-bundle.pem`
          )
        }
        : { rejectUnauthorized: false },
    logging: true,
    entities: [join(__dirname, '../commons/**/entities/mail', '*.entity.{ts,js}')],
    bigNumberStrings: false,
    extra: {
      connectionLimit: Number(MYSQL_MAIL_MAX_POOL) || 10
    }
  };

  return createConnections([defaultConfig, mailConfig]);
};
