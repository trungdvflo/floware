exports.REPORT = 'report';

exports.ENVIRONMENTS = {
  LOCAL: 'LOCAL',
  DEV: 'DEV',
  UAT: 'UAT',
  STAGE: 'STAGE',
  PROD: 'PROD',
};

exports.DDL = {
  TABLES: 'tables',
  FUNCTIONS: 'functions',
  PROCEDURES: 'procedures',
};

exports.STATUSES = {
  NEW: 'new',
  UPDATED: 'updated',
  DEPRECATED: 'deprecated',
  SEEDING: 'seeding',
};

/**
 * This code exports a function called "getDBDestination" which retrieves the database details based on the given environment.
 * The function takes two parameters: "env" (the environment name) and "mail" (a flag indicating whether to retrieve the mail database details).
 * It returns an object containing the host, database name, username, and password based on the provided environment and mail flag.
 * The function uses environment variables to retrieve the database details.
 */
exports.getDBDestination = (env, mail = false) => {
  const allEnv = [
    // List of environments and their corresponding database details
    {
      envName: this.ENVIRONMENTS.LOCAL,
      host: process.env.DEV_DB_HOST,
      database: mail ? process.env.DEV_DB_MAIL : process.env.DEV_DB_NAME,
      user: process.env.DEV_DB_USERNAME,
      password: process.env.DEV_DB_PASSWORD
    },
    {
      envName: this.ENVIRONMENTS.DEV,
      host: process.env.DEV_DB_HOST,
      database: mail ? process.env.DEV_DB_MAIL : process.env.DEV_DB_NAME,
      user: process.env.DEV_DB_USERNAME,
      password: process.env.DEV_DB_PASSWORD
    }, 
    {
      envName: this.ENVIRONMENTS.UAT,
      host: process.env.UAT_DB_HOST,
      database: mail ? process.env.UAT_DB_MAIL : process.env.UAT_DB_NAME,
      user: process.env.UAT_DB_USERNAME,
      password: process.env.UAT_DB_PASSWORD
    }, 
    {
      envName: this.ENVIRONMENTS.STAGE,
      host: process.env.STAGE_DB_HOST,
      database: mail ? process.env.STAGE_DB_MAIL : process.env.STAGE_DB_NAME,
      user: process.env.STAGE_DB_USERNAME,
      password: process.env.STAGE_DB_PASSWORD
    }, 
    {
      envName: this.ENVIRONMENTS.PROD,
      host: process.env.PROD_DB_HOST,
      database: mail ? process.env.PROD_DB_MAIL : process.env.PROD_DB_NAME,
      user: process.env.PROD_DB_USERNAME,
      password: process.env.PROD_DB_PASSWORD
    }
  ];
  
  // Find the environment object based on the provided environment name
  return allEnv.find(({ envName }) => envName === env.toUpperCase());
}
/**
/**
 * This code is written in JavaScript.
 * 
 * Summary: This code exports a function called getSourceEnv which takes an environment name as input and returns the corresponding source environment. It checks the input environment name against predefined environment constants (DEV, UAT, STAGE, PROD) and returns the previous environment based on the input. If the input environment name does not match any of the constants, it returns DEV by default.
 */

exports.getSourceEnv = (envName) => {
  if (envName === this.ENVIRONMENTS.DEV) return this.ENVIRONMENTS.LOCAL;
  if (envName === this.ENVIRONMENTS.UAT) return this.ENVIRONMENTS.DEV;
  if (envName === this.ENVIRONMENTS.STAGE) return this.ENVIRONMENTS.UAT;
  if (envName === this.ENVIRONMENTS.PROD) return this.ENVIRONMENTS.STAGE;
  return DEV;
}
/**
/*
Summary:
This code defines a function called getDestEnv that takes an environment as input and returns the next environment in the sequence: DEV, UAT, STAGE, PROD. If the input environment is PROD, it will return PROD again. If the input environment is not recognized, it will default to DEV. 

*/

exports.getDestEnv = env => {
  if (env === this.ENVIRONMENTS.LOCAL) return this.ENVIRONMENTS.DEV;
  if (env === this.ENVIRONMENTS.DEV) return this.ENVIRONMENTS.UAT;
  if (env === this.ENVIRONMENTS.UAT) return this.ENVIRONMENTS.STAGE;
  if (env === this.ENVIRONMENTS.STAGE) return this.ENVIRONMENTS.PROD;
  if (env === this.ENVIRONMENTS.PROD) return this.ENVIRONMENTS.PROD;
  return this.ENVIRONMENTS.DEV;
}

/*
Summary:
This code exports a function getDBName that takes in two parameters: env and isDbMail. It returns the corresponding database name based on the environment (env) and isDbMail flag. If isDbMail is true, it returns the database name for mail environment, otherwise it returns the database name for the specified environment. If the environment is not recognized, it returns the database name for the development environment by default.

Language: JavaScript
*/

exports.getDBName = (env, isDbMail = false) => {
  if (isDbMail) {
    if (env === this.ENVIRONMENTS.DEV) return process.env.DEV_DB_MAIL;
    if (env === this.ENVIRONMENTS.UAT) return process.env.UAT_DB_MAIL;
    if (env === this.ENVIRONMENTS.STAGE) return process.env.STAGE_DB_MAIL;
    if (env === this.ENVIRONMENTS.PROD) return process.env.PROD_DB_MAIL;
  }
  if (env === this.ENVIRONMENTS.DEV) return process.env.DEV_DB_NAME;
  if (env === this.ENVIRONMENTS.UAT) return process.env.UAT_DB_NAME;
  if (env === this.ENVIRONMENTS.STAGE) return process.env.STAGE_DB_NAME;
  if (env === this.ENVIRONMENTS.PROD) return process.env.PROD_DB_NAME;
  return process.env.DEV_DB_NAME;

}


/**
 * This function replaces a specific domain in a given DDL (Data Definition Language)
 * with the corresponding domain based on the destination environment.
 * @param {*} ddl - The DDL string to be modified.
 * @param {*} destEnv - The destination environment (UAT, STAGE, or PROD).
 * @returns {string} - The modified DDL string with the domain replaced based on the destination environment.
 */
exports.replaceWithEnv = (ddl, destEnv) => {
  if (destEnv === this.ENVIRONMENTS.UAT) {
    return ddl.replace(/@flodev.net/, '@flouat.net');
  } else if (destEnv === this.ENVIRONMENTS.STAGE) {
    return ddl.replace(/@flouat.net/, '@flostage.com');
  } else if (destEnv === this.ENVIRONMENTS.PROD) {
    return ddl.replace(/@flostage.com/, '@flomail.net');
  }
  return ddl;
}