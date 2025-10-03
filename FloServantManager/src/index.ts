import dotenv from 'dotenv';
import AWS from 'aws-sdk';

(async () => {
  try {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    const ssm = new AWS.SSM({
      region,
      apiVersion: '2014-11-06'
    });
    const ssmParams = {
      Name: process.env.AWS_SSM_NAME || '',
      WithDecryption: true
    };
    
    async function getConfigEnvVariables() {
      try {
        if(!ssmParams.Name) throw new Error('Could not get AWS_SSM_NAME env');
    
        const data = await (new Promise<AWS.SSM.GetParameterResult>((resolve, reject) => {
          ssm.getParameter(ssmParams, (err, data) => {
            if(err) return reject(err);
            resolve(data);
          });
        }));
    
        const parameter: Object = JSON.parse((data.Parameter || {}).Value || '{}');
        for (const [key, value] of Object.entries(parameter)) {
          process.env[key] = value;
        }
      } catch (err) {
        throw err;
      }
    }
  
    if (process.env.NODE_ENV === 'production' && process.env.AWS_SSM_NAME) {
      await getConfigEnvVariables();
    } else {
      const result = dotenv.config();
      if (result.error) {
        throw result.error;
      }
    }
    
    import('./arena/arenaServer');
    import('./bullmq');
    
  } catch (err) {
    throw err;
  }
})().catch(err => console.log(err));
