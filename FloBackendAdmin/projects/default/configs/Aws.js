require('dotenv').config();

module.exports = {
  S3: {
    active: true,
    AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    AWS_S3_REGION: process.env.AWS_S3_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_S3_SIGNED_URL_EXPIRES: process.env.AWS_S3_SIGNED_URL_EXPIRES || 120
  },
  SQS: {
    active: true,
    API_VERSION: process.env.API_VERSION,
    AWS_REGION: process.env.AWS_REGION
  }

};

