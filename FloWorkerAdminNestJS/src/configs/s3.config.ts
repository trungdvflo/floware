import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  CopyObjectCommandOutput,
  DeleteObjectCommandOutput
} from '@aws-sdk/client-s3';

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
export class InitS3 {
  private readonly s3: S3Client;
  private readonly AWS_S3_BUCKET_NAME: string;

  constructor(bucket: string, config: S3Config) {
    this.AWS_S3_BUCKET_NAME = bucket || 'bucket_name';

    this.s3 = new S3Client(config);
  }

  async Copy(source, destination) {
    try {
      const params = {
        Bucket: this.AWS_S3_BUCKET_NAME,
        CopySource: `${this.AWS_S3_BUCKET_NAME}/${source}`,
        Key: destination
      };

      const res: CopyObjectCommandOutput = await this.s3.send(new CopyObjectCommand(params));
      return res.$metadata.httpStatusCode === HTTP_OK ? { code: 1 } : { code: 0 };
    } catch (error) {
      return error;
    }
  }

  /**
   * source : S3/Wasabi  filepath + filename
   * @param {*} source
   */
  async Delete(source) {
    try {
      const params = {
        Bucket: this.AWS_S3_BUCKET_NAME,
        Key: source
      };

      const res: DeleteObjectCommandOutput = await this.s3.send(new DeleteObjectCommand(params));
      return res.$metadata.httpStatusCode === HTTP_NO_CONTENT ? { code: 1 } : { code: 0 };
    } catch (error) {
      return error;
    }
  }

  /**
   *
   * @param {*} Prefix
   */
  ListFiles(Prefix) {
    try {
      const params = {
        Prefix,
        Bucket: this.AWS_S3_BUCKET_NAME
      };

      return this.s3.send(new ListObjectsCommand(params));
    } catch (error) {
      return error;
    }
  }
}

export type S3Config = {
  endpoint: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
};
