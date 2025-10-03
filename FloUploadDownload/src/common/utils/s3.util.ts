import { S3 } from 'aws-sdk';
import { GetObjectOutput, HeadObjectOutput } from 'aws-sdk/clients/s3';
import { AWSError } from 'aws-sdk/lib/error';
import fs from 'fs';
import { Readable } from 'stream';
import { randomStringGenerator, Utils } from './common';

export type ObjectS3 = {
  code: number,
  url: string,
  message?: string
};
export class S3Utility {
  private s3: S3;
  private Bucket: string;
  constructor(options: S3.Types.ClientConfiguration, bucket?: string) {
    this.s3 = new S3(options);
    this.Bucket = bucket;
  }

  GenUid() {
    const uid = `${randomStringGenerator()}`;
    return uid;
  }

  GenSource(s3Path: string, uid: string, dir: string, ext: string) {
    // const parseFolder = Utils.parseFolder(uid);
    const parseFolder = dir;
    const source = `${s3Path}/${parseFolder}/${uid}.${ext}`;
    return source;
  }
  /**
   * Check file exist
   * source : S3/Wasabi  filepath + filename
   * @param {*} source
   */
  FileExist(source: string, Bucket: string = this.Bucket) {
    return new Promise((resolve, reject) => {
      try {
        this.s3.headObject({
          Bucket,
          Key: source
        }, (err: AWSError, data: HeadObjectOutput) => {
          if (err) {
            resolve(false);
          }
          if (data && data.ContentLength) {
            resolve(true);
          }
          resolve(false);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @param {*} source : local filepath + filename
   * @param {*} destination : S3/Wasabi  filepath + filename
   */
  Upload(source: string, destination: string, Bucket: string = this.Bucket) {
    return new Promise((resolve, reject) => {
      try {
        const fileContent: Buffer = fs.readFileSync(source);
        if (!fileContent) {
          resolve({
            code: 0,
            message: 'Empty content'
          });
        }
        this.s3.upload({
          Bucket,
          Key: destination,
          Body: fileContent
        }, (err: Error, data) => {
          if (err) {
            reject(err);
          }
          resolve({
            code: 1,
            data
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * upload to s3 from buffer
   * @param dataBuffer :
   * @param ext :
   * @param source :
   * @returns true/false
   */
  uploadFromBuffer(dataBuffer: Buffer, ext: string, source: string
    , Bucket: string = this.Bucket) {
    return new Promise((resolve, reject) => {
      try {
        this.s3.upload({
            Bucket,
            Body: dataBuffer,
            ContentType: ext,
            Key: source,
            ACL: 'private',
        }, (err, data) => {
            if (err) reject(err);
            resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @param {*} source : local filepath + filename
   * @param {*} destination : S3/Wasabi  filepath + filename
   */
  UploadMultipart(source, destination, Bucket: string = this.Bucket, queueSize = 4) {
    return new Promise((resolve, reject) => {
      try {
        if (queueSize <= 0) {
          resolve({
            code: 0,
            message: 'Invalid queueSize'
          });
        }
        const fileContent: Buffer = fs.readFileSync(source);
        if (!fileContent) {
          resolve({
            code: 0,
            message: 'Empty content'
          });
        }

        this.s3.upload({
          Bucket,
          Key: destination,
          Body: fileContent
        }, { partSize: 10 * 1024 * 1024, queueSize },
          (err: Error, data) => {
            if (err) {
              reject(err);
            }
            resolve({
              code: 1,
              data
            });
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * source : S3/Wasabi  filepath + filename
   * @param {*} source
   * Expires in 100 seconds
   */
  DownloadUrl(source: string, Expires: number = 100, Bucket: string = this.Bucket)
    : Promise<ObjectS3> {
    return new Promise((resolve, reject) => {
      try {
        const url: string = this.s3.getSignedUrl('getObject', {
          Bucket,
          Key: source,
          Expires
        });
        if (url === null) {
          reject({
            code: 0,
            message: 'Get url download failed'
          });
        }
        resolve({
          code: 1,
          url
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * source : S3/Wasabi  filepath + filename
   * @param {*} source
   */
  DownloadStreen(source: string, Bucket: string = this.Bucket) {
    return new Promise((resolve, reject) => {
      try {
        this.s3.getObject({
          Bucket,
          Key: source
        }, (err: AWSError, data: GetObjectOutput) => {
          if (err) {
            reject(err);
          }
          resolve({ code: 1, data });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * source : S3/Wasabi  filepath + filename
   * @param {*} source
   */
  Delete(source: string, Bucket: string = this.Bucket) {
    return new Promise((resolve, reject) => {
      try {
        this.s3.deleteObject({
          Bucket,
          Key: source
        }, (err: AWSError) => {
          if (err) {
            reject(err);
          }
          resolve({ code: 1 });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();

    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}

let instance: any = null;
export const S3Util = (options: S3.Types.ClientConfiguration, bucket?: string): S3Utility => {
  if (!instance) {
    instance = new S3Utility(options, bucket);
  }
  return instance;
};