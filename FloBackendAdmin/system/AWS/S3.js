const _ = require('lodash');
const fs = require('fs');
const AWS = require('aws-sdk');

const store = {
  caches: []
};

const commands = {
  /**
     * 
     * @param {*} source : local filepath + filename  
     * @param {*} destination : S3/Wasabi  filepath + filename  
     */
  Upload(source, destination) {
    return new Promise((resolve, reject) => {
      try {
        const fileContent = fs.readFileSync(source);
        if (_.isEmpty(fileContent) === true) {
          resolve({
            code: 0,
            message: 'Empty content'
          });
        }
        const params = {
          Bucket: this.config.Bucket,
          Key: destination,
          Body: fileContent
        };

        this.upload(params, (err, data) => {
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
  },

  /**
     * 
     * @param {*} source : local filepath + filename  
     * @param {*} destination : S3/Wasabi  filepath + filename  
     * @param {*} queueSize : the size of the concurrent queue manager to upload parts
     */
  UploadMultipart(source, destination, queueSize = 4) {
    return new Promise((resolve, reject) => {
      try {
        if (queueSize <= 0) {
          resolve({
            code: 0,
            message: 'Invalid queueSize'
          });
        }
        const fileContent = fs.readFileSync(source);
        if (_.isEmpty(fileContent) === true) {
          resolve({
            code: 0,
            message: 'Empty content'
          });
        }
        const params = {
          Bucket: this.config.Bucket,
          Key: destination,
          Body: fileContent
        };
        const options = {
          partSize: 10 * 1024 * 1024, // 10 MB
          queueSize
        };

        this.upload(params, options, (err, data) => {
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
  },

  CreateMultipartUpload(destination) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          Bucket: this.config.Bucket,
          Key: destination
        };
        this.createMultipartUpload(params, (err, data) => {
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
  },

  CompleteMultipartUpload(destination, Parts, UploadId) {
    return new Promise((resolve, reject) => {
      try {
        if (_.isEmpty(Parts) === true) {
          resolve({
            code: 0,
            message: 'Invalid MultipartUpload'
          });
        }

        const params = {
          Bucket: this.config.Bucket,
          Key: destination,
          MultipartUpload: { Parts },
          UploadId
        };

        this.completeMultipartUpload(params, (err, data) => {
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
  },
  /**
     * 
     */
  UploadPart(source, destination, UploadId, PartNumber = false) {
    return new Promise((resolve, reject) => {
      try {
        if (PartNumber <= 0) {
          resolve({
            code: 0,
            message: 'Invalid PartNumber'
          });
        }
        const fileContent = fs.readFileSync(source);
        if (_.isEmpty(fileContent) === true) {
          resolve({
            code: 0,
            message: 'Empty content'
          });
        }
        const params = {
          Bucket: this.config.Bucket,
          Key: destination,
          Body: fileContent,
          PartNumber,
          UploadId
        };

        this.uploadPart(params, (err, data) => {
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
  },

  /**
     * source : S3/Wasabi  filepath + filename 
     * @param {*} source 
     */
  Download(source) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          Bucket: this.config.Bucket,
          Key: source
        };

        this.getObject(params, (err, data) => {
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
  },

  /**
     * source : S3/Wasabi  filepath + filename 
     * @param {*} source 
     */
  DownloadSignedUrl(source) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          Bucket: this.config.Bucket,
          Key: source,
          Expires: 10 // 10 second
        };

        const url = this.getSignedUrl('getObject', params);
        if (_.isNull(url)) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({
            code: 0,
            message: 'Get url donwload failed'
          });
        }
        resolve({
          code: 1,
          data: url
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
     * source : S3/Wasabi  filepath + filename 
     * @param {*} source 
     */
  Delete(source) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          Bucket: this.config.Bucket,
          Key: source
        };

        this.deleteObject(params, (err) => {
          if (err) {
            reject(err);
          }
          resolve({
            code: 1
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
     * Check file exist
     * source : S3/Wasabi  filepath + filename 
     * @param {*} source 
     */
  FileExist(source) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          Bucket: this.config.Bucket,
          Key: source
        };
        const result = { code: 0 };
        this.headObject(params, (err, data) => {
          if (err) {
            resolve(result);
          }
          if (_.isEmpty(data) === false) {
            result.code = 1;
          }
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

};

module.exports.ApplyAwsS3 = (cache, path, projectBasePath, AwsConfig) => {
  store.caches.push({
    cache,
    path,
    projectBasePath,
    AwsConfig
  });
};

module.exports.Start = (AwsConfig) => {
  return new Promise((resolve, reject) => {
    try {
      let AwsS3EP = false;
      if (_.get(AwsConfig, 'AWS_S3_ENDPOINT', false) !== false) {
        AwsS3EP = new AWS.Endpoint(AwsConfig.AWS_S3_ENDPOINT);
      }

      _.forEach(store.caches, (v) => {
        try {
          const cache = require(v.path);
          const bindCommand = {};

          _.forEach(commands, (func, funcName) => {
            const config = {
              credentials: {
                accessKeyId: AwsConfig.AWS_S3_ACCESS_KEY_ID,
                secretAccessKey: AwsConfig.AWS_S3_SECRET_ACCESS_KEY
              },
              apiVersion: '2006-03-01',
              Bucket: AwsConfig.AWS_S3_BUCKET,
              region: AwsConfig.AWS_S3_REGION
            };
            if (_.isEmpty(AwsS3EP) === false) {
              config.endpoint = AwsS3EP;
            }
            bindCommand[funcName] = func.bind(
              new AWS.S3(config)
            );
          });

          require.cache[v.path].exports = bindCommand;
          _.forEach(cache, (func, funcName) => {
            if (_.isFunction(func) === true) {
              require.cache[v.path].exports[funcName] = func.bind(
                bindCommand
              );
            }
          });
        } catch (e) {
          reject(e);
        }
      });

      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
};
