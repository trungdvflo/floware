const _ = require('lodash');
const Fs = require('fs');
const Mkdirp = require('mkdirp');
const Path = require('path');
const FileType = require('file-type');
const {
  UniqueIdByDate,
  ParseFolder,
  GetFilesizeInBytes
} = require('./Utils');
const Flow = require('./Flow');

const CheckFile = async (out, source, allowFileExts = []) => {
  return new Promise((resolve) => {
    out.on('finish', async () => {
      const extObj = await FileType.fromFile(source);

      if (_.isEmpty(extObj) === true) {
        Fs.unlinkSync(source);
        return resolve({
          status: false,
          message: 'Invalid extension'
        });
      }

      if (_.isEmpty(allowFileExts) === false) {
        if (_.indexOf(allowFileExts, extObj.ext) < 0) {
          return resolve({
            status: false,
            message: 'Invalid extension'
          });
        }
      }
      return resolve({
        status: true,
        filesize: GetFilesizeInBytes(source),
        message: 'success'
      });
    });
  });
};

module.exports = async (payload, pathUpload, allowFileExts = []) => {
  try {
    await Mkdirp.sync(pathUpload);
    const ext = Path.extname(payload.file.hapi.filename).toLowerCase().split('.').pop();
    if (_.isEmpty(allowFileExts) === false) {
      if (_.indexOf(allowFileExts, ext) < 0) {
        return {
          status: false,
          message: `${ext.toUpperCase()} is not allowed`
        };
      }
    }

    const flow = Flow(pathUpload);
    const uuid = UniqueIdByDate();

    const checkFile = await flow.post(payload);
    const parseFolder = ParseFolder(uuid);

    if (checkFile.status === 'done') {
      const finalPath = `${pathUpload}/${parseFolder}/${uuid}`;
      await Mkdirp.sync(finalPath);
      const filePath = `${finalPath}/${uuid}.${ext}`;
      const out = await Fs.createWriteStream(filePath);
      flow.write(checkFile.identifier, out, {
        cleanChunks: true
      });
      const upload = await CheckFile(out, filePath, allowFileExts);
      const uploadStatus = _.get(upload, 'status', false);
      if (uploadStatus === true) {
        return {
          status: checkFile.status,
          fileName: payload.file.hapi.filename,
          fileUid: uuid,
          length: upload.filesize
        };
      }
      return {
        status: false,
        message: _.get(upload, 'message', 'Upload failed')
      };
    }
    if (checkFile.status === 'upload_failed') {
      return {
        status: false,
        message: 'Upload failed'
      };
    }
    return false;
  } catch (error) {
    return {
      status: false,
      message: 'Write file failed'
    };
  }
};
