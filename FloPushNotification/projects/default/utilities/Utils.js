const _ = require('lodash');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const FileType = require('file-type');
const Fse = require('fs-extra');
const sharp = require('sharp');
const queryString = require('query-string');
const { mimeWordDecode } = require('emailjs-mime-codec');   
const AppsConstant = require('../constants/AppsConstant');

const Utils = {
    SubString: (str, length = 0, suffix = '...') => {
        if (_.isString(str) === false || _.isNumber(length) === false || length <= 0) {
            return '';
        }
        if (_.isEmpty(suffix) === false && str.length > length) {
            return `${str.trim().substr(0, length).trim()}${suffix}`;
        }

        return str.trim().substr(0, length).trim();
    },
    // format 1568269168.587
    Timestamp: (millisecond = Date.now()) => {
        try {
            if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
                return millisecond / 1000;
            }
            return false;
        } catch (error) {
            return false;
        }
    },
    decryptAccessToken: (subKeyEncrypt, accessTokenEncrypt, refreshTokenEncrypt) => {        
        const preSubKey = CryptoJS.AES.decrypt(subKeyEncrypt, AppsConstant.AES_KEY);
        const subKey = preSubKey.toString(CryptoJS.enc.Utf8);

        const preAccessToken = CryptoJS.AES.decrypt(accessTokenEncrypt, subKey);
        const accessToken = preAccessToken.toString(CryptoJS.enc.Utf8);

        const preRefreshToken = CryptoJS.AES.decrypt(refreshTokenEncrypt, subKey);
        const refreshToken = preRefreshToken.toString(CryptoJS.enc.Utf8);
        return {
            accessToken,
            refreshToken
        };
    },
    replaceErrors: (key, value) => {
        if (value instanceof Error) {
            const error = {};
            Object.getOwnPropertyNames(value).forEach((k) => {
                error[k] = value[k];
            });
            return error;
        }
        return value;
    },

    // utc, ex : 1568269168587
    ValidDatetime: (millisecond) => {
        try {
            const diff = moment('1970-01-01').diff(millisecond, 'days');
            if (diff > 0) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    },

    CachePatterns: (keyCache = AppsConstant.MAIN_KEY_CACHE, func, key, user = null) => {
        let mainKey = `${keyCache}:${func}:${key}`;
        if (user !== null) {
            mainKey = `${keyCache}:${user}:${func}:${key}`;
        }
        return mainKey;
    },

    ParseUserId: (userId) => {
        const number = userId.toLocaleString();
        const numberArr = number.split(',');
        const result = ['0', '0', '0', '0'];
        _.forEach(numberArr, (item, i) => {
            const index = (result.length) - numberArr.length + i;
            result[index] = Number(item);
        });
        return result.join('/');
    },

    CropImg: async (filename, destinationFile, width, height) => {
        try {
            const resizedFile = await sharp(`${filename}`)
                .resize(width, height, { position: 'centre' })
                .toFile(`${destinationFile}`);
            return resizedFile;
        } catch (error) {
            return false;
        }
    },

    UploadImgS3: async (S3, source, destination, ACL = false, allowFileExts = [], isRemoveSource = false) => {
        return new Promise(async (resolve) => {
            /**
             * Upload to Wasabi
             */
            const extObj = await FileType.fromFile(source);
            if (_.isEmpty(extObj) === true) {
                Fse.unlinkSync(source);
                return resolve({
                    status: false,
                    message: 'Invalid extension'
                });
            }

            if (_.isEmpty(allowFileExts) === false) {
                if (_.indexOf(allowFileExts, extObj.ext) < 0) {
                    Fse.unlinkSync(source);
                    return resolve({
                        status: false,
                        message: 'Invalid extension'
                    });
                }
            }

            const uploadStatus = await S3.Upload(source, destination, ACL);
            /**
             * Delete local 
             */
            if (isRemoveSource === true) {
                Fse.unlinkSync(source);
            }
            if (uploadStatus.code === 1) {
                return resolve({
                    status: true,
                    message: 'success'
                });
            }

            return resolve({
                status: false,
                message: 'Upload file failed'
            });
        });
    },

    UploadS3: async (S3, out, source, destination, allowFileExts = [], isRemoveSource = true) => {
        return new Promise((resolve) => {
            out.on('finish', async () => {
                /**
                 * Upload to Wasabi
                 */
                const extObj = await FileType.fromFile(source);
                if (_.isEmpty(extObj) === true) {
                    Fse.unlinkSync(source);
                    return resolve({
                        status: false,
                        message: 'Invalid extension'
                    });
                }
                if (_.isEmpty(allowFileExts) === false) {
                    if (_.indexOf(allowFileExts, extObj.ext) < 0) {
                        Fse.unlinkSync(source);
                        return resolve({
                            status: false,
                            message: 'Invalid extension'
                        });
                    }
                }

                const uploadStatus = await S3.Upload(source, destination);
                /**
                 * Delete local 
                 */
                if (isRemoveSource === true) {
                    Fse.unlinkSync(source);
                }
                if (uploadStatus.code === 1) {
                    return resolve({
                        path: source,
                        status: true,
                        message: 'success'
                    });
                }

                return resolve({
                    status: false,
                    message: 'Upload file failed'
                });
            });
        });
    },

    GenerateContactAvatarUrl: (appSabre, md5Email, addressbookid, cardUri) => {
        return `contact-avatar?m=${md5Email}&ad=${addressbookid}&u=${cardUri}&tm=${Utils.Timestamp()}`;
    },

    validURL: (str) => {
        const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
      + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
      + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
      + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
      + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
      + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!pattern.test(str);
    },
    /**
     * @param str 
     * example: =?UTF-8?B?dGjhu6d5IHRpw6pu?= <thuytien1224@gmail.com>, 
     * =?UTF-8?Q?Ng=C3=B4_Th=C3=A0nh_=C4=90=C6=B0?= =?UTF-8?Q?=E1=BB=A3c?=\n <duocnt2012@flodev.net>
     * =?utf-8?Q?Ng=C3=B4_Th=C3=A0nh_=C4=90=C6=B0=E1=BB=A3c?=\n <duocnt2012@flodev.net>
     * =?UTF-8?Q?Ng=C3=B4_Th=C3=A0nh_=C4=90=C6=B0?=\n =?UTF-8?Q?=E1=BB=A3c_Th=C3=A8m_Nh=C3=A0_C=C3=B3_Ho?=\n =?UTF-8?Q?a_R=E1=BA=A5t_=C4=90=E1=BA=B9p?= <duocnt2012@flodev.net>
     * "=?utf-8?Q?thuy=40flomail.net?=" <thuy@flomail.net>
     */
    FromConvertUTF8ToStrings: (str) => {
        let rawStr = str;
        if (str.indexOf('=?UTF-8') !== -1 || str.indexOf('=?utf-8') !== -1) {
            const arrStr = str.split(' ');
            const email = arrStr[arrStr.length - 1];
            arrStr.splice(-1, 1);
            _.forEach(arrStr, (item, index) => {
                arrStr[index] = arrStr[index].replace('\n', ''); 
                const tempStr = arrStr[index].match(/(=)(.*)(=)/);
                const strDecode = mimeWordDecode(tempStr[0]);
                arrStr[index] = arrStr[index].replace(tempStr[0], strDecode); 
            });
            rawStr = `${arrStr.join('')} ${email}`;
        }
        return rawStr;
    }
};
module.exports = Utils;
