const Fse = require('fs-extra');
const MD5 = require('md5');

const {
    UploadImgS3
} = require('../../../projects/default/utilities/Utils');

const AppsConstant = require('../../../projects/default/constants/AppsConstant');
const Code = require('../../../projects/default/constants/ResponseCodeConstant');

module.exports = async (data, S3) => {
    try {
        const ext = 'jpg';
        const fileStat = Fse.statSync(data.filePath);
        
        if (fileStat.size <= 0) {
            Fse.unlinkSync(data.filePath);
            return {
                status: false,
                code: Code.DISALLOWED_FILE_SIZE,
                httpCode: Code.INVALID_DATA,
                message: 'Invalid filesize'
            };
        }
        const destinationPath = `${AppsConstant.CONTACT_AVATAR_PATH}/${data.m}/${data.ad}`;
        const destination = `${destinationPath}/${data.u}/${data.u}.${ext}`;
        await UploadImgS3(S3, data.filePath, destination);
        await Fse.emptyDir(data.localPath);
        await Fse.rmdir(data.localPath);
        return {
            code: 1,
            filepath: destination,
            filename: `${data.u}.${ext}`,
            fileExt: ext,
            fileUid: data.u,
            size: fileStat.size
        };
    } catch (error) {
        throw error;
    }
};
