require('dotenv').config();

const _ = require('lodash');
const fs = require('fs');
const AWS = require('aws-sdk');
const Connection = require('./Connection');

const AwsConfig = Connection.S3_DAV;
const commands = {
    /**
     *
     * @param {*} source : local filepath + filename
     * @param {*} destination : S3/Wasabi  filepath + filename
     */
    Upload(source, destination, ACL = false) {
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
                if (_.isEmpty(ACL) === false) {
                    params.ACL = ACL;
                }

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
                const options = { partSize: 10 * 1024 * 1024, queueSize };

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

    /**
     * source : S3/Wasabi  filepath + filename
     * @param {*} source
     */
    Download(source) {
        return new Promise((resolve, reject) => {
            try {
                const params = {
                    Bucket: this.config.Bucket,
                    Key: source,
                    Expires: 10 // 10 seconds
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
    DownloadFile(source) {
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
    },

    /**
     * 
     * @param {*} Prefix 
     */
    ListFiles(Prefix) {
        return new Promise((resolve, reject) => {
            try {
                const params = { 
                    Prefix, 
                    Bucket: this.config.Bucket
                };
                this.listObjects(params, (err, data) => {
                    if (err) return reject(err);
                    return resolve(data);
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * 
     */
    Copy(source, destination) {
        return new Promise((resolve, reject) => {
            try {
                const { Bucket } = this.config;
                const params = { 
                    Bucket,
                    CopySource: `${Bucket}/${source}`,
                    Key: destination
                };
                
                this.copyObject(params, (err, data) => {
                    if (err) return reject(err);
                    resolve({
                        code: 1
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};

try {
    let AwsS3EP = false;
    if (_.get(AwsConfig, 'AWS_S3_ENDPOINT', false) !== false) {
        AwsS3EP = new AWS.Endpoint(AwsConfig.AWS_S3_ENDPOINT);
    }

    const creds = new AWS.Credentials({
        accessKeyId: AwsConfig.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AwsConfig.AWS_S3_SECRET_ACCESS_KEY
    });

    const bindCommand = {};

    _.forEach(commands, (func, funcName) => {
        const config = {
            credentials: creds,
            apiVersion: '2006-03-01',
            Bucket: AwsConfig.AWS_S3_BUCKET
        };
        if (_.isEmpty(AwsS3EP) === false) {
            config.endpoint = AwsS3EP;
        }
        bindCommand[funcName] = func.bind(new AWS.S3(config));
    });
    module.exports = bindCommand;
} catch (e) {
    throw e;
}
