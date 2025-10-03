/* tslint:disable: no-console */

import { Logger, QueryRunner } from "typeorm";

export class TypeORMCustomLogger implements Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    // Implement your custom logging logic here
    const connectionType = queryRunner?.getReplicationMode().toUpperCase();
    console.log(`::${connectionType}:: query: ${query}`);
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner
  ) {
    // Implement your custom logging logic here
    console.error(`Error executing query: ${query}`);
    console.error(`Error details: ${error}`);
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner
  ) {
    // Implement your custom logging logic here
    console.warn(`Slow query detected: ${query}`);
    console.warn(`Execution time: ${time} ms`);
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    // Implement your custom logging logic here
    console.log(`Schema build: ${message}`);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    // Implement your custom logging logic here
    console.log(`Migration: ${message}`);
  }

  log(
    level: "log" | "info" | "warn",
    message: any,
    queryRunner?: QueryRunner
  ) {
    // Implement your custom logging logic here
    switch (level) {
      case "log":
        console.log(message);
        break;
      case "info":
        console.info(message);
        break;
      case "warn":
        console.warn(message);
        break;
      // Add more cases as needed
    }
  }
}
