const path = require('path');
const util = require('util');
const mysql = require('mysql2');

const {
  getSourceEnv, getDBName, getDBDestination,
  STATUSES: { NEW, UPDATED, DEPRECATED },
  replaceWithEnv,
  DDL: { TABLES, PROCEDURES, FUNCTIONS }
} = require('../../configs/db');

const {
  readFromFile, saveToFile, copyFile, makeSureFolderExisted, removeFile
} = require('../utils/file.helper');
const { log } = require('console');

const _backupFolder = `backup/${new Date().toLocaleDateString().replace(/\//g, '_')}`

/**
 * This function migrates functions from one database to another.
 * 
 * @param {object} destConnection - The destination database connection.
 * @param {object} dbConfig - The database configuration.
 * @param {string} fromList - The list of functions to migrate.
 * @returns {number} - The number of functions migrated.
 */
async function migrateFunctions(destConnection, dbConfig, fromList = NEW) {
  const srcEnv = getSourceEnv(dbConfig.envName);
  const srcFolder = `db/${srcEnv}/${getDBName(srcEnv)}/${FUNCTIONS}`;
  const destFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${FUNCTIONS}`;
  const backupFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${_backupFolder}/${FUNCTIONS}`;
  makeSureFolderExisted(backupFolder);
  try {
    const fnFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${FUNCTIONS}`;
    const fnList = `${fromList}.list`;
    const functionNames = readFromFile(fnFolder, fnList, 1)

    // Check if there are functions to migrate
    if (!functionNames.length) {
      alog.dev(`No FUNCTION to migrate to ${dbConfig.envName}`);
      return 0;
    }
    if (+process.env.EXPERIMENTAL < 1) {
      // Start a transaction
      await util.promisify(destConnection.beginTransaction).call(destConnection);
    }
    try {
      for (const functionName of functionNames) {
        const fileName = `${functionName}.sql`;
        const dropQuery = `DROP FUNCTION IF EXISTS \`${functionName}\`;`;
        const importQuery = readFromFile(srcFolder, fileName);
        if (+process.env.EXPERIMENTAL === 1) {
          alog.warning('Experimental Run::', { dropQuery, importQuery });
        } else {
          alog.warning('Dropping...', functionName);
          await util.promisify(destConnection.query).call(destConnection, dropQuery);
          // DON'T migrate OTE_,test normally
          if (functionName.indexOf('OTE_') === -1 && functionName.indexOf('test') === -1) {
            alog.info('Creating...', functionName);
            await util.promisify(destConnection.query).call(destConnection, importQuery);
            // copy to backup
            copyFile(path.join(destFolder, fileName), path.join(backupFolder, fileName));
            // copy to soft migrate
            copyFile(path.join(srcFolder, fileName), path.join(destFolder, fileName));
          }
        }
      }
      // clean after migrated done
      saveToFile(fnFolder, fnList, '');
      if (+process.env.EXPERIMENTAL < 1) {
        // Commit the transaction if all queries are successful
        await util.promisify(destConnection.commit).call(destConnection);
      }
      return functionNames?.length;
    } catch (err) {
      if (+process.env.EXPERIMENTAL < 1) {
        // Rollback the transaction in case of an error
        await util.promisify(destConnection.rollback).call(destConnection);
      }
      alog.error(`Error during migration: `, err);
      return 0;
    }
  } catch (err) {
    alog.error('Error reading functions-migrate.list: ', err);
    return 0;
  }
}

/**
 * Migrates procedures from one database to another.
 * 
 * @param {*} destConnection The destination database connection. 
 * @param {*} dbConfig The configuration for the databases.
 * @param {*} fromList The list of procedures to migrate. 
 * @returns The number of procedures migrated. 
 */
async function migrateProcedures(destConnection, dbConfig, fromList = NEW) {
  // Get the source environment and folders
  const srcEnv = getSourceEnv(dbConfig.envName);
  const srcFolder = `db/${srcEnv}/${getDBName(srcEnv)}/${PROCEDURES}`;
  const destFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${PROCEDURES}`;
  const backupFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${_backupFolder}/${PROCEDURES}`;
  makeSureFolderExisted(backupFolder);
  try {
    const spFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${PROCEDURES}`;
    const spList = `${fromList}.list`;
    const procedureNames = readFromFile(spFolder, spList, 1)
    // Check if there are procedures to migrate
    if (!procedureNames?.length) {
      alog.dev(`No PROCEDURE to migrate to ${dbConfig.envName}`);
      return 0;
    }
    // Start a transaction if experimental flag is not set
    if (+process.env.EXPERIMENTAL < 1) {
      await util.promisify(destConnection.beginTransaction).call(destConnection);
    }
    try {
      // Migrate each procedure
      for (const procedureName of procedureNames) {
        const fileName = `${procedureName}.sql`;
        const dropQuery = `DROP PROCEDURE IF EXISTS \`${procedureName}\`;`;
        const importQuery = readFromFile(srcFolder, fileName);

        if (+process.env.EXPERIMENTAL === 1) {
          alog.warning('Experimental Run::', { dropQuery, importQuery });
        } else {
          // Drop the procedure, import the new one, and create a backup
          alog.warning('Dropping...', procedureName);
          await util.promisify(destConnection.query).call(destConnection, dropQuery);
          // DON'T migrate OTE_,test normally
          if (procedureName.indexOf('OTE_') === -1 && procedureName.indexOf('test') === -1) {
            alog.info('Creating...', procedureName);
            await util.promisify(destConnection.query).call(destConnection, replaceWithEnv(importQuery, dbConfig.envName));
            // copy to backup
            copyFile(path.join(destFolder, fileName), path.join(backupFolder, fileName));
            // copy to soft migrate
            copyFile(path.join(srcFolder, fileName), path.join(destFolder, fileName));
          }
        }
      }
      // Clean up the procedure list after migration
      saveToFile(spFolder, spList, '');
      // Commit the transaction if all queries are successful
      if (+process.env.EXPERIMENTAL < 1) {
        await util.promisify(destConnection.commit).call(destConnection);
      }
      return procedureNames?.length;
    } catch (err) {
      // Rollback the transaction in case of an error
      if (+process.env.EXPERIMENTAL < 1) {
        await util.promisify(destConnection.rollback).call(destConnection);
      }
      alog.error(`Error during migration: `, err);
      return 0;
    }
  } catch (err) {
    alog.error('Error reading procedures-migrate.list: ', err);
    return 0;
  }
}

/**
 * This function deprecate functions from destination db.
 * 
 * @param {object} destConnection - The destination database connection.
 * @param {object} dbConfig - The database configuration.
 * @returns {number} - The number of functions migrated.
 */
async function deprecateFunctions(destConnection, dbConfig) {
  const srcEnv = getSourceEnv(dbConfig.envName);
  try {
    const fnFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${FUNCTIONS}`;
    const fnList = `deprecated.list`;
    const destFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${FUNCTIONS}`;
    const functionNames = readFromFile(fnFolder, fnList, 1);
    if (!functionNames.length) {
      alog.dev(`No FUNCTION to deprecated to ${dbConfig.envName}`);
      return 0;
    }
    if (+process.env.EXPERIMENTAL < 1) {
      // Start a transaction
      await util.promisify(destConnection.beginTransaction).call(destConnection);
    }
    try {
      for (const functionName of functionNames) {
        const dropQuery = `DROP FUNCTION IF EXISTS \`${functionName}\`;`;
        if (+process.env.EXPERIMENTAL === 1) {
          alog.warning('Experimental Run::', { dropQuery });
        } else {
          alog.info('Dropping...', functionName);
          await util.promisify(destConnection.query).call(destConnection, dropQuery);
          // soft delete
          removeFile(destFolder, `${functionName}.sql`);
        }
      }
      if (+process.env.EXPERIMENTAL < 1) {
        // clean after migrated done
        saveToFile(fnFolder, fnList, '');
        // Commit the transaction if all queries are successful
        await util.promisify(destConnection.commit).call(destConnection);
      }
      return functionNames?.length;
    } catch (err) {
      if (+process.env.EXPERIMENTAL < 1) {
        // Rollback the transaction in case of an error
        await util.promisify(destConnection.rollback).call(destConnection);
      }
      alog.error(`Error during migration: `, err);
      return 0;
    }
  } catch (err) {
    alog.error('Error reading functions-migrate.list: ', err);
    return 0;
  }
}

/**
 * This function deprecate table from destination db.
 * 
 * @param {object} destConnection - The destination database connection.
 * @param {object} dbConfig - The database configuration.
 * @returns {number} - The number of table migrated.
 */
async function deprecateTables(destConnection, dbConfig) {
  const srcEnv = getSourceEnv(dbConfig.envName);
  try {
    const tblFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${TABLES}`;
    const tblList = `deprecated.list`;
    const tableNames = readFromFile(tblFolder, tblList, 1);
    if (!tableNames.length) {
      alog.dev(`No TABLES to deprecated to ${dbConfig.envName}`);
      return 0;
    }

    try {
      for (const functionName of tableNames) {
        const dropQuery = `DROP TABLE IF EXISTS \`${functionName}\`;`;
        alog.warning('Experimental Run::', { dropQuery });
      }
      return tableNames?.length;
    } catch (err) {
      alog.error(`Error during migration: `, err);
      return 0;
    }
  } catch (err) {
    alog.error('Error reading functions-migrate.list: ', err);
    return 0;
  }
}


/**
 * removed deprecated procedures from destination db.
 * 
 * @param {*} destConnection The destination database connection. 
 * @param {*} dbConfig The configuration for the databases.
 * @returns The number of procedures migrated. 
 */
async function deprecateProcedures(destConnection, dbConfig) {
  // Get the source environment and folders
  const srcEnv = getSourceEnv(dbConfig.envName);
  const backupFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${_backupFolder}/${PROCEDURES}`;
  makeSureFolderExisted(backupFolder);
  try {
    const spFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${PROCEDURES}`;
    const spList = `deprecated.list`;
    const destFolder = `db/${dbConfig.envName}/${getDBName(dbConfig.envName)}/${PROCEDURES}`;
    const procedureNames = readFromFile(spFolder, spList, 1);
    // Check if there are procedures to migrate
    if (!procedureNames?.length) {
      alog.dev(`No PROCEDURE to deprecated to ${dbConfig.envName}`);
      return 0;
    }
    // Start a transaction if experimental flag is not set
    if (+process.env.EXPERIMENTAL < 1) {
      await util.promisify(destConnection.beginTransaction).call(destConnection);
    }
    try {
      // Migrate each procedure
      for (const procedureName of procedureNames) {
        const dropQuery = `DROP PROCEDURE IF EXISTS \`${procedureName}\`;`;

        if (+process.env.EXPERIMENTAL === 1) {
          alog.warning('Experimental Run::', { dropQuery });
        } else {
          alog.info('Dropping...', procedureName);
          // Drop the procedure, import the new one, and create a backup
          await util.promisify(destConnection.query).call(destConnection, dropQuery);
          // soft delete
          removeFile(destFolder, `${procedureName}.sql`);
        }
      }
      // Commit the transaction if all queries are successful
      if (+process.env.EXPERIMENTAL < 1) {
        // Clean up the procedure list after migration
        saveToFile(spFolder, spList, '');
        await util.promisify(destConnection.commit).call(destConnection);
      }
      return procedureNames?.length;
    } catch (err) {
      // Rollback the transaction in case of an error
      if (+process.env.EXPERIMENTAL < 1) {
        await util.promisify(destConnection.rollback).call(destConnection);
      }
      alog.error(`Error during migration: `, err);
      return 0;
    }
  } catch (err) {
    alog.error('Error reading procedures-migrate.list: ', err);
    return 0;
  }
}

/**
 * 
 * @param {*} connection 
 * @param {*} tableName 
 * @returns 
 */
async function isTableExists(connection, tableName) {
  try {
    const rows = await util.promisify(connection.query)
      .call(connection, `SHOW TABLES LIKE ?`, [tableName]);
    return rows?.length > 0;
  } catch (err) {
    alog.error(`Error checking if table ${tableName} exists:`, err);
    return false;
  }
}

/**
 * 
 * @param {*} destConnection 
 * @param {*} dbConfig 
 * @returns 
 */
async function migrateTables(destConnection, dbConfig) {
  const srcEnv = getSourceEnv(dbConfig.envName);
  const srcFolder = `db/${srcEnv}/${getDBName(srcEnv)}/${TABLES}`;
  try {
    const tblFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${TABLES}`
    const tblList = `${NEW}.list`;
    const tableNames = readFromFile(tblFolder, tblList, 1);
    if (!tableNames?.length) {
      alog.dev(`No TABLE to migrate to ${dbConfig.envName}`);
      return 0;
    }
    let tablesMigrated = 0;
    if (+process.env.EXPERIMENTAL < 1) {
      // Start a transaction
      await util.promisify(destConnection.beginTransaction).call(destConnection);
    }
    try {
      for (const tableName of tableNames) {
        const fileName = `${tableName}.sql`;

        if (await isTableExists(destConnection, tableName)) {
          alog.dev(`Table ${tableName} already exists in the destination database.`);
          continue;
        }

        const importQuery = readFromFile(srcFolder, fileName);

        if (+process.env.EXPERIMENTAL === 1) {
          alog.warning('Experimental Run::', { importQuery });
        } else {
          console.log(importQuery);
          alog.info('Creating...', tableName);
          await util.promisify(destConnection.query).call(destConnection, importQuery);
        }
        tablesMigrated++;
      }
      // clean after migrated done
      saveToFile(tblFolder, tblList, '');
      if (+process.env.EXPERIMENTAL < 1) {
        // Commit the transaction if all queries are successful
        await util.promisify(destConnection.commit).call(destConnection);
      }
      return tablesMigrated;
    } catch (err) {
      if (+process.env.EXPERIMENTAL < 1) {
        // Rollback the transaction in case of an error
        await util.promisify(destConnection.rollback).call(destConnection);
        alog.error(`Error during table migration:`, err);
      }
      return 0;
    }
  } catch (err) {
    alog.error('Error reading tables-migrate.list:', err);
    return 0;
  }
}

/**
 * 
 * @param {*} destConnection 
 * @param {*} dbConfig 
 * @returns 
 */
async function alterTableColumns(destConnection, dbConfig, alterType = 'columns') {
  const srcEnv = getSourceEnv(dbConfig.envName);
  const tableMap = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/tables`;
  try {
    const tableNames = readFromFile(tableMap, `alter-${alterType}.list`, 1);
    if (!tableNames?.length) {
      alog.dev(`No TABLE to alter for ${dbConfig.envName}`);
      return 0;
    }
    let tablesAltered = 0;

    if (+process.env.EXPERIMENTAL < 1) {
      // Start a transaction
      await util.promisify(destConnection.beginTransaction).call(destConnection);
    }
    try {
      for (const tableName of tableNames) {
        const alterFile = `${tableName}.sql`;
        if (!(await isTableExists(destConnection, tableName))) {
          alog.dev(`Table ${tableName} does not exist in the destination database.`);
          continue;
        }
        const alterQuery = readFromFile(`${tableMap}/alters/${alterType}`, alterFile);
        if (+process.env.EXPERIMENTAL === 1) {
          alog.warning('::Experimental Run::', { alterQuery });
        } else {
          alog.info('Updating...', alterQuery);
          await util.promisify(destConnection.query).call(destConnection, alterQuery);
        }
        tablesAltered++;
      }
      if (+process.env.EXPERIMENTAL < 1) {
        // Commit the transaction if all queries are successful
        await util.promisify(destConnection.commit).call(destConnection);
      }
      return tablesAltered;
    } catch (err) {
      if (+process.env.EXPERIMENTAL < 1) {
        // Rollback the transaction in case of an error
        await util.promisify(destConnection.rollback).call(destConnection);
      }
      alog.error(`Error during table alteration:`, err);
      return 0;
    }
  } catch (err) {
    alog.error('Error reading tables/alters.list:', err);
    return 0;
  }
}

async function seedDataToTables(sourceConnection, destConnection, dbConfig) {
  const srcEnv = getSourceEnv(dbConfig.envName);
  try {
    const tblFolder = `map-migrate/${srcEnv}-to-${dbConfig.envName}/${getDBName(srcEnv)}/${TABLES}`
    const tblList = `seeding.list`;
    const tableNames = readFromFile(tblFolder, tblList, 1);


    if (!tableNames?.length) {
      alog.dev(`No TABLE to seed to ${dbConfig.envName}`);
      return 0;
    }
    let tablesSeeded = 0;
    for (const tableName of tableNames) {
      // check if table exists in destination db
      if (!(await isTableExists(destConnection, tableName))) {
        alog.info(`Table ${tableName} does not exist in the destination database.`);
        continue;
      }
      // check if table exists in source db
      if (!(await isTableExists(sourceConnection, tableName))) {
        alog.info(`Table ${tableName} does not exist in the source database.`);
        continue;
      }

      // Get all data from table via select from dest db
      const selectQuery = `SELECT * FROM ${tableName}`;
      const destData = await util.promisify(destConnection.query)
        .call(destConnection, selectQuery);

      // check is dest data empty
      if (destData.length) {
        alog.info(`Table ${tableName} already seeded in the destination database.`);
        continue;
      }

      // Get all data from table via select from source db
      const sourceQuery = `SELECT * FROM ${tableName}`;
      const sourceData = await util.promisify(sourceConnection.query).call(sourceConnection, sourceQuery);

      // list all columns of table
      const columns = await util.promisify(sourceConnection.query).call(sourceConnection, `SHOW COLUMNS FROM ${tableName}`);
      // create insert query from list fields of table without id
      const insertFields = columns
        .filter(column => column.Field !== 'id')
        .map(column => column.Field)
        .join(',');
      // loop data and insert into destination db and make sure same field name
      const values = sourceData.map(row => columns
        .filter(column => column.Field !== 'id')
        .map(column =>
          // check if field is string then add quote and handle json value
          typeof row[column.Field] === 'string'
            ? `'${JSON.stringify(row[column.Field])}'`
            : row[column.Field]
        )
      );

      try {
        if (+process.env.EXPERIMENTAL < 1) {
          // Start a transaction
          await util.promisify(destConnection.beginTransaction).call(destConnection);
        }
        for (let row of values) {
          const insertQuery = `INSERT INTO ${tableName} (${insertFields}) VALUES (${row.join(',')})`;
          if (+process.env.EXPERIMENTAL === 1) {
            alog.warning('Experimental Run::', { insertQuery });
          } else {
            alog.info('Seeding...', insertQuery);
            await util.promisify(destConnection.query).call(destConnection, insertQuery);
          }
        };
        if (+process.env.EXPERIMENTAL < 1) {
          // Commit the transaction if all queries are successful
          await util.promisify(destConnection.commit).call(destConnection);
        }
      } catch (err) {
        if (+process.env.EXPERIMENTAL < 1) {
          // Rollback the transaction in case of an error
          await util.promisify(destConnection.rollback).call(destConnection);
        }
        alog.error(`Error during seeding data:`, err);
      }
      tablesSeeded++;
    }

    return tablesSeeded;
  } catch (err) {
    alog.error('Error reading tables-migrate.list:', err);
    return 0;
  }
}

exports.migrator = (ddl, fromList) => (env) => {
  alog.info('Migrating...', ddl, fromList, env);
  // Create a MySQL destConnection
  const start = Date.now();
  const dbConfig = getDBDestination(env);
  // Create a MySQL destConnection
  const destConnection = mysql.createConnection({
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password
  });

  // Connect to the MySQL server
  destConnection.connect(err => {
    if (err) {
      alog.error('Error connecting to the database: ', err);
      process.exit(1);
    }
    // Retrieve the list of DDL
    (async () => {
      let rs = 0;
      let alterRs = 0;
      switch (ddl) {
        case FUNCTIONS:
          if (fromList === DEPRECATED) {
            rs = await deprecateFunctions(destConnection, dbConfig);
          } else {
            rs = await migrateFunctions(destConnection, dbConfig, fromList);
          }
          break;
        case PROCEDURES: if (fromList === DEPRECATED) {
          rs = await deprecateProcedures(destConnection, dbConfig);
        } else {
          rs = await migrateProcedures(destConnection, dbConfig, fromList);
        }
          break;
        case TABLES:
          if (fromList === NEW) {
            // :RISK IF CHANGE: only migrate table new
            rs = await migrateTables(destConnection, dbConfig);
          } else if (fromList === UPDATED) {
            alterRs = await alterTableColumns(destConnection, dbConfig);
            alterRs += await alterTableColumns(destConnection, dbConfig, 'indexes');
          } else if (fromList === 'SEEDING') {
            const srcDbConfig = getDBDestination(getSourceEnv(env));
            const sourceConnection = mysql.createConnection({
              host: srcDbConfig.host,
              database: srcDbConfig.database,
              user: srcDbConfig.user,
              password: srcDbConfig.password
            });
            rs = await seedDataToTables(sourceConnection, destConnection, dbConfig);
          }
          alog.dev(`Alter ${alterRs} ${env}.${getDBName(env)}.${ddl} done in:: ${Date.now() - start}ms`);
          break;
      }
      // Close the MySQL destConnection
      destConnection.end();
      alog.dev(`Migrate ${rs} ${env}.${getDBName(env)}.${ddl} done in:: ${Date.now() - start}ms`);
    })();
  });
}