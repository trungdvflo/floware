import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  // aws access
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // aws s3 config
  s3AccessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  s3Endpoint: process.env.AWS_S3_ENDPOINT,
  s3Region: process.env.AWS_S3_REGION,
  s3Bucket: process.env.AWS_S3_BUCKET,
  s3DavBucket: process.env.AWS_S3_DAV_BUCKET,
  s3Path: process.env.UPLOAD_FILE_PATH || '',
  s3SSM: process.env.AWS_SSM_NAME || '/test/khoapm',
}));
