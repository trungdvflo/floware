global.__basedir = process.env.BASE_DIR || __dirname;

const { Command } = require('commander');
const SSMStorage = require('./configs/SSMStorage');
const {
  ENVIRONMENTS: { DEV, UAT, STAGE, PROD },
  REPORT,
  DDL: { TABLES, FUNCTIONS, PROCEDURES },
  STATUSES: { NEW, UPDATED, DEPRECATED }
} = require('./configs/db');

require('dotenv').config();

const { service: { exporter, comparator, migrator } } = require('./andb-core');

(async () => {
  const {
    AWS_SSM_NAME_DEV = '',
    AWS_SSM_NAME_UAT = '',
    AWS_SSM_NAME_STAGE = '',
    AWS_SSM_NAME_PROD = '',
    AWS_REGION_DEV = '',
    AWS_REGION_UAT = '',
    AWS_REGION_STAGE = '',
    AWS_REGION_PROD = '',
  } = process.env;

  if (AWS_SSM_NAME_DEV.length) {
    await SSMStorage.init(AWS_SSM_NAME_DEV, AWS_REGION_DEV, DEV);
  }
  if (AWS_SSM_NAME_UAT.length) {
    await SSMStorage.init(AWS_SSM_NAME_UAT, AWS_REGION_UAT, UAT);
  }
  if (AWS_SSM_NAME_STAGE.length) {
    await SSMStorage.init(AWS_SSM_NAME_STAGE, AWS_REGION_STAGE, STAGE);
  }
  if (AWS_SSM_NAME_PROD.length) {
    await SSMStorage.init(AWS_SSM_NAME_PROD, AWS_REGION_PROD, PROD);
  }

  const program = new Command();
  program
    .command("export")
    .version('1.0.0', '-v, --version')
    .option('-t, --tables [value]', 'export tables', exporter(TABLES))
    .option('-p, --procedures [value]', 'export procedures', exporter(PROCEDURES))
    .option('-f, --functions [value]', 'export functions', exporter(FUNCTIONS));

  program
    .command("compare")
    .version('1.1.0', '-v, --version')
    .option('-p, --procedures [value]', 'compare procedures to get ready migrate to next ENV', comparator(PROCEDURES))
    .option('-f, --functions [value]', 'compare functions to get ready migrate to next ENV', comparator(FUNCTIONS))
    .option('-t, --tables [value]', 'compare tables to get ready migrate to next ENV', comparator(TABLES))
    .option('-r, --report [value]', 'compare tables to get ready migrate to next ENV', comparator(REPORT));

  program
    .command('migrate')
    .version('1.2.0', '-v, --version')
    .option('-p, --procedures [value]', 'export procedures', migrator(PROCEDURES, NEW))
    .option('-f, --functions [value]', 'export functions', migrator(FUNCTIONS, NEW))
    .option('-t, --tables [value]', 'export functions', migrator(TABLES, NEW))
    .option('-s, --seed-data [value]', 'export functions', migrator(TABLES, 'SEEDING'))
    .option('-up, --updated-procedures [value]', 'update procedures', migrator(PROCEDURES, UPDATED))
    .option('-uf, --updated-functions [value]', 'update functions', migrator(FUNCTIONS, UPDATED))
    .option('-ut, --updated-tables [value]', 'update functions', migrator(TABLES, UPDATED))
    .option('-dp, --deprecate-procedures [value]', 'deprecate procedures', migrator(PROCEDURES, DEPRECATED))
    .option('-df, --deprecate-functions [value]', 'deprecate functions', migrator(FUNCTIONS, DEPRECATED))

  program.parse();

})();