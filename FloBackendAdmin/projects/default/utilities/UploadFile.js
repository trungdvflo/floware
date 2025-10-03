const _ = require('lodash');
const Fs = require('fs');
const Mkdirp = require('mkdirp');
const Path = require('path');
const FileType = require('file-type');
const { UniqueIdByDate, ParseFolder } = require('./Utils');
const AppsConstant = require('../constants/AppsConstant');
const Flow = require('./Flow');
const S3 = require('./aws/S3');
const Cache = require('../caches/Cache');
const { generateFileUploadCacheKey } = require("./Utils");
const Server = require('../app').server;

function tryUnlink(source) {
  try {
    setTimeout(() => {
      Fs.unlinkSync(source);
    }, 36e5);
  } catch (err) {
    Server.log(['error'], err);
  }
}
const UploadS3 = async (out, source, destination, allowFileExts = []) => {
  return new Promise((resolve) => {
    out.on('finish', async () => {
      /**
       * Upload to Wasabi
       */
      const extObj = await FileType.fromFile(source);
      if (_.isEmpty(extObj) === true) {
        tryUnlink(source);
        return resolve({
          status: false,
          message: 'Invalid extension'
        });
      }

      if (_.isEmpty(allowFileExts) === false) {
        if (_.indexOf(allowFileExts, extObj.ext) < 0) {
          tryUnlink(source);
          return resolve({
            status: false,
            message: 'Not allow extension'
          });
        }
      }

      const uploadStatus = await S3.Upload(source, destination);
      /**
             * Delete local 
             */
      tryUnlink(source);
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
  });
};

async function UpdateRedisReleaseFile(uuid, newCache, withoutUpdateRedis) {
  if (!uuid || uuid === 'null') {
    return false;
  }
  const cacheKey = generateFileUploadCacheKey(uuid);
  const cache = await Cache.get(cacheKey);
  const oldCache = cache === null ? {} : JSON.parse(cache);
  if (withoutUpdateRedis) {
    return oldCache;
  }
  // dont allow reset status upload
  const oldStatus = oldCache.upload_status || 0;
  const newStatus = newCache.upload_status || 0;
  const uploadStatus = oldStatus >= newStatus
    ? oldStatus
    : newStatus;
  const nextCache = { ...oldCache, ...newCache, uploadStatus };
  await Cache.set(cacheKey, JSON.stringify(nextCache), 24 * 3600);
  return nextCache;
}
async function uploadStatusHandler(fileUid, newCache, withoutUpdateRedis = false) {
  if (!fileUid) {
    return 0;
  }
  // 1. keep file state to redis
  const nextCache = await UpdateRedisReleaseFile(fileUid, newCache, withoutUpdateRedis);
  // only update to db for install file
  if (!nextCache || nextCache.isDsym === 1) { return 0; }
  // 2. find to updates
  const { Op } = require('sequelize');
  const { ReleaseModel } = require('../models');
  const Utils = require("./Utils");
  const release = await ReleaseModel.findOne({
    attributes: ['id'],
    where: {
      [Op.or]: [
        { file_uid: fileUid },
        { file_dsym_uid: fileUid }
      ]
    },
    raw: true
  });
  // not insert yet
  if (!release || !release.id) {
    return 0;
  }
  return ReleaseModel.update({
    upload_status: newCache.upload_status || AppsConstant.UPLOAD_STATUS.UPLOADING,
    updated_date: Utils.Timestamp()
  }, {
    where: {
      id: release.id
    }
  });
}


// isDsym: 1,
// id: result.id,
// message: 'save dsym to db'
async function LastPartUploadTrigger(uuid, releaseSaved) {
  if (!uuid) {
    return false;
  }
  // prevent upload trash to S3
  const cached = await Cache.get(generateFileUploadCacheKey(uuid));
  const {
    localPathUpload = '',
    checkFile = '',
    pathUpload = '',
    parseFolder = '',
    ext = '',
    allowFileExts = '',
    upload_status,
    message
  } = cached === null ? {} : JSON.parse(cached);
  if (upload_status === AppsConstant.UPLOAD_STATUS.UPLOADED_SUCCESS) {
    return uploadStatusHandler(uuid, {
      upload_status,
      message
    }, true);
  }
  // 1. update last part to cache
  await uploadStatusHandler(uuid, { ...releaseSaved, upload_status: AppsConstant.UPLOAD_STATUS.UPLOADING });
  const finalPath = `${pathUpload}/${parseFolder}/${uuid}`;
  await Mkdirp.sync(finalPath);
  const flow = Flow(localPathUpload);
  const filePath = `${finalPath}/${uuid}.${ext}`;
  const out = await Fs.createWriteStream(filePath);
  flow.write(checkFile.identifier, out, {
    cleanChunks: true
  });
  const destination = `${AppsConstant.AUTO_UPDATE_PATH}/${parseFolder}/${uuid}/${uuid}.${ext}`;
  const upload = await UploadS3(out, filePath, destination, allowFileExts);
  const uploadStatus = _.get(upload, 'status', false);
  if (uploadStatus === true) {
    return uploadStatusHandler(uuid, {
      upload_status: AppsConstant.UPLOAD_STATUS.UPLOADED_SUCCESS,
      message: 's3 update success'
    });
  }
  Server.log(['error'], { errorMsg: 'S3 upload fail:', ...upload });
  await uploadStatusHandler(uuid, {
    upload_status: AppsConstant.UPLOAD_STATUS.UPLOAD_FAILED,
    message: 's3 upload failed'
  });
}

async function HandleUpload(payload, localPathUpload, pathUpload, allowFileExts = []) {
  const uuid = UniqueIdByDate();
  try {
    await Mkdirp.sync(pathUpload);
    await Mkdirp.sync(localPathUpload);

    const ext = Path.extname(payload.file.hapi.filename).toLowerCase().split('.').pop();
    if (_.isEmpty(allowFileExts) === false) {
      if (_.indexOf(allowFileExts, ext) < 0) {
        return {
          status: 'upload_failed',
          message: `${ext.toUpperCase()} is not allowed`
        };
      }
    }
    const flow = Flow(localPathUpload);
    const checkFile = await flow.post(payload);
    const parseFolder = ParseFolder(uuid);

    if (checkFile.status === 'done') {
      // 1. store data ready to run on other threat
      await uploadStatusHandler(uuid, {
        localPathUpload,
        checkFile,
        pathUpload,
        parseFolder,
        uuid,
        ext,
        allowFileExts,
        upload_status: AppsConstant.UPLOAD_STATUS.UPLOADING,
        message: 'Start upload',
        flowTotalChunks: payload.flowTotalChunks,
        upload_time: +new Date()
      });
      // 2. upload to S3 when single part upload
      if (+payload.flowTotalChunks === 1) {
        await LastPartUploadTrigger(uuid, {});
      }
      return {
        status: checkFile.status,
        fileName: payload.file.hapi.filename,
        fileUid: uuid,
        length: payload.flowTotalSize
      };
    }
    if (checkFile.status === 'upload_failed') {
      await uploadStatusHandler(uuid, {
        upload_status: AppsConstant.UPLOAD_STATUS.UPLOAD_FAILED,
        message: 'checkFile failed'
      });
      return {
        status: false,
        message: 'Upload failed'
      };
    }
    return {
      status: checkFile.status,
      fileName: payload.file.hapi.filename,
      fileUid: uuid
    };
  } catch (error) {
    await uploadStatusHandler(uuid, {
      upload_status: AppsConstant.UPLOAD_STATUS.UPLOAD_FAILED,
      message: 'catch failed'
    });
    return {
      status: false,
      message: 'Write file failed'
    };
  }
}

module.exports = {
  HandleUpload,
  LastPartUploadTrigger,
  uploadStatusHandler
};
