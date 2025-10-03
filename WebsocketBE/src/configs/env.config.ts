import * as AWS from 'aws-sdk';
import { NODE_ENV } from '../common/constants';

export async function loadEnvVarFromAwsSsM() {
  if (process.env.NODE_ENV === NODE_ENV.production && process.env.AWS_SSM_NAME) {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    const ssm = new AWS.SSM({
      region,
      apiVersion: '2014-11-06',
    });
    const ssmParams = {
      Name: process.env.AWS_SSM_NAME || '',
      WithDecryption: true,
    };

    if (!ssmParams.Name) throw new Error('Could not get AWS_SSM_NAME env');

    const data = await new Promise<AWS.SSM.GetParameterResult>((resolve, reject) => {
      return ssm.getParameter(ssmParams, (err, value) => {
        if (err) return reject(err);
        return resolve(value);
      });
    });

    const parameter: object = JSON.parse((data.Parameter || {}).Value || '{}');
    for (const [key, value] of Object.entries(parameter)) {
      process.env[key] = value;
    }
  }
}
