import { registerAs } from '@nestjs/config';
import * as AWS from 'aws-sdk';
export const WORKER_ENV = {
  production: 'production',
  test: 'test',
  development: 'development'
};

export default registerAs('aws', () => ({
  s3Path: process.env.UPLOAD_FILE_PATH || '',
  bucketName: process.env.AWS_S3_BUCKET || 'bucket_name',
  endpoint: process.env.AWS_S3_ENDPOINT,
  region: process.env.AWS_S3_REGION,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
}));

export async function loadConfig() {
  if (process.env.NODE_ENV === WORKER_ENV.production && process.env.AWS_SSM_NAME) {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    const ssm = new AWS.SSM({
      region,
      apiVersion: '2014-11-06'
    });
    const ssmParams = {
      Name: process.env.AWS_SSM_NAME || '',
      WithDecryption: true
    };

    if (!ssmParams.Name) throw new Error('Could not get AWS_SSM_NAME env');

    const data = await (new Promise<AWS.SSM.GetParameterResult>((resolve, reject) => {
      return ssm.getParameter(ssmParams, (err, value) => {
        if (err) return reject(err);
        return resolve(value);
      });
    }));

    const parameter: object = JSON.parse((data.Parameter || {}).Value || '{}');
    for (const [key, value] of Object.entries(parameter)) {
      process.env[key] = value;
    }
  }
}