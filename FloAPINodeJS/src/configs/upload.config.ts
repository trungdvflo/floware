import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({

  limitBodySizeUpload: process.env.UPLOAD_LIMIT_BODY_SIZE || '100mb',
  s3DownloadExpireTime: process.env.AWS_S3_DOWNLOAD_EXPIRE_TIME?
    +process.env.AWS_S3_DOWNLOAD_EXPIRE_TIME : 900,
  requestTimeOut: process.env.UPLOAD_REQUEST_TIME_OUT?
    +process.env.UPLOAD_REQUEST_TIME_OUT : 1000000,
}));