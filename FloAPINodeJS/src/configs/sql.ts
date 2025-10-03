import { registerAs } from '@nestjs/config';
import { TypeORMCustomLogger } from '../common/utils/typeorm-custom-log';

export default registerAs('database', () => ({
  retryAttempts: process.env.RETRY || 15,
  type: 'mysql',
  logging: true,// process.env.NODE_ENV !== 'production' ? true : false,
  logger: process.env.TYPEORM_LOG_ENABLE === 'true' ? new TypeORMCustomLogger() : false,
  extra: {
    connectionLimit: Number(process.env.DB_MAX_POOL) || 100,
    bigNumberStrings: false,
    charset: 'utf8mb4_unicode_ci'
  },
  ssl: String(process.env.DB_SSL).toLowerCase() === 'true',
  replication: {
    master: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    slaves: [{
      host: process.env.DB_HOST_RO,
      port: Number(process.env.DB_PORT_RO) || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    }],

    /**
     * If true, PoolCluster will attempt to reconnect when connection fails. (Default: true)
     */
    canRetry: true,

    /**
     * If connection fails, node's errorCount increases.
     * When errorCount is greater than removeNodeErrorCount,
     * remove a node in the PoolCluster. (Default: 5)
     */
    removeNodeErrorCount: 15,

    /**
     * If connection fails,
     * specifies the number of milliseconds before another connection attempt will be made.
     * If set to 0, then node will be removed instead and never re-used. (Default: 0)
     */
    restoreNodeTimeout: 15,

    /**
     * Determines how slaves are selected:
     * RR: Select one alternately (Round-Robin).
     * RANDOM: Select the node by random function.
     * ORDER: Select the first node available unconditionally.
     */
    selector: "ORDER"
  },
  entities: [
    __dirname + '/../**/*.entity{.ts,.js}',
    __dirname + '/../**/**/*.entity{.ts,.js}',
  ]
}));