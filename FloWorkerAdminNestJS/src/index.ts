import fs from 'fs';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import 'reflect-metadata';
import { initDB } from './configs/typeorm.config';
import { Graylog } from './configs/graylog.config';
import { getArgs } from './commons/utils/common.util';

async function init() {
  const RSA_PRIVATE_KEY =
    process.env['RSA_PRIVATE_KEY_PATH'] && fs.readFileSync(process.env['RSA_PRIVATE_KEY_PATH']);
  process.env['RSA_PRIVATE_KEY'] = RSA_PRIVATE_KEY && RSA_PRIVATE_KEY.toString();

  await initDB();
}

async function getSSMConfigEnvVariables(ssm: AWS.SSM, ssmParams: any) {
  try {
    if (!ssmParams.Name) throw new Error('Could not get AWS_SSM_NAME env');

    const data = await new Promise<AWS.SSM.GetParameterResult>((resolve, reject) => {
      ssm.getParameter(ssmParams, (err, item) => {
        if (err) return reject(err);
        resolve(item);
      });
    });

    // eslint-disable-next-line @typescript-eslint/ban-types
    const parameter: object = JSON.parse((data.Parameter || {}).Value || '{}');
    for (const [key, value] of Object.entries(parameter)) {
      process.env[key] = value;
    }
  } catch (err) {
    // Sentry.captureException(err);
    Graylog.getInstance().SendLog({
      moduleName: "ssm",
      message: "ERROR: ssm",
      fullMessage: err.message
    });
    throw err;
  }
}

async function getConfigByEnv() {
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  const ssm = new AWS.SSM({
    region,
    apiVersion: '2014-11-06'
  });
  const ssmParams = {
    Name: process.env.AWS_SSM_NAME || '',
    WithDecryption: true
  };

  if (process.env.NODE_ENV === 'production' && process.env.AWS_SSM_NAME) {
    await getSSMConfigEnvVariables(ssm, ssmParams);
  } else {
    const result = dotenv.config();
    if (result.error) {
      throw result.error;
    }
  }
}
(async () => {
  const args = getArgs();
  let type = "workers";
  if (args.endsWith('.migrate')) type = "migrates";
  const nameContainer = `./${type}/${args}`;
  // init env
  await getConfigByEnv();
  // declare connection db
  await init();
  import(nameContainer);
})().catch((err) => {
  Graylog.getInstance().SendLog({
    moduleName: "init resource",
    message: "ERROR: init resource",
    fullMessage: err.message
  });
  // Sentry.captureException(err);
});