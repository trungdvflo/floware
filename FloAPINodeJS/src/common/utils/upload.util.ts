import { BadRequestException } from "@nestjs/common";
import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import uploadConfig from "../../configs/upload.config";
import { maxFile } from "../constants";
import { ErrorCode } from "../constants/error-code";
import { buildFailItemResponse } from "./respond";
export const FileAttachmentAcceptType = {
  image: ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'tiff'],
  text: ['txt', 'xml', 'csv', 'text', 'rtf', 'rtx', 'etf', 'rt', 'des', 'readme', 'vcf', 'ics', 'vcard',
    'json', 'css'],
  application: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'pdf', 'zip', 'rar', '7z', 'iso', 'ttf'],
  video: ['webm', 'mkv', 'x-matroska', 'flv', 'flash', 'vob', 'ogv', 'ogg', 'drc', 'gif', 'gifv',
    'mng', 'avi', 'x-msvideo', 'msvideo', 'mov', 'quicktime', 'qt',
    'wmv', 'x-ms-wmv', 'yuv', 'rm', 'rmvb', 'asf', 'amv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe',
    'mpv', 'm2v', 'm4v', 'svi', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'f4v', 'f4p', 'f4a', 'f4b'],
  audio: ['3gp', 'aa', 'aac', 'aax', 'act', 'aiff', 'amr', 'ape', 'au', 'awb', 'dct',
    'dss', 'dvf', 'flac', 'gsm', 'iklax', 'ivs', 'm4a', 'm4b', 'mmf', 'mp3', 'mpeg', 'mpc', 'msv', 'ogg',
    'oga', 'opus', 'ra', 'rm', 'raw', 'sln', 'tta', 'vox', 'wav', 'wave', 'x-wav', 'wma', 'mv', 'webm'],
  other: ['7z', 'rar', 'zip', 'iso', 'ttf'],
};

export const FileUploadUtil = {
  getFileTypeFromFileName: (fname: string) => {
    try {
      // tslint:disable-next-line:no-bitwise
      return fname.slice(((fname.lastIndexOf('.') - 1) >>> 0) + 2);
    } catch (e) {
      throw new BadRequestException(
        buildFailItemResponse(ErrorCode.BAD_REQUEST, `${fname} is not allowed!`),
      );
    }
  },
  // getDirThumb: (fileType: string) => {
  //   switch (fileType) {
  //     case THUMB_TYPE.video:
  //       const url = `${cfApp().thumbnailUrl}/thumb/Video.png`;
  //       return url;
  //     case THUMB_TYPE.audio:
  //       return `${cfApp().thumbnailUrl}/thumb/Audio.png`;
  //     case THUMB_TYPE.image:
  //       return `${cfApp().thumbnailUrl}/thumb/image.png`;
  //     case THUMB_TYPE.application:
  //       return `${cfApp().thumbnailUrl}/thumb/application.png`;
  //     case THUMB_TYPE.text:
  //       return `${cfApp().thumbnailUrl}/thumb/text.png`;
  //     default:
  //       return `${cfApp().thumbnailUrl}/thumb/other.png`;
  //   }
  // },
  getTypeFile: (fileType: string) => {
    // const fileExtension = fileType.toLowerCase().split('/').shift();
    for (const [k, v] of Object.entries(FileAttachmentAcceptType)) {
      if (v.includes(fileType)) return k;
    }
    return 'unknown';
  },

  isValidFileType: (fileType: string) => {
    for (const [k, v] of Object.entries(FileAttachmentAcceptType)) {
      if (v.find((e) => e === fileType.toLowerCase())) return true;
    }
    return false;
  },
  getLimitFileSize: (configSize: string) => {
    const def: number = 200*1024*1024;
    if (!configSize) return def;
    try {
      const size = {
        'kb': 1024,
        'mb': 1024*1024,
        'gb': 1024*1024* 1024,
      };
      const sizeString = configSize.substring(configSize.length - 2).toLowerCase();
      const sizeNumber = Number(configSize.substring(0, configSize.length - 2));
      return sizeNumber*size[sizeString];
    } catch (error) {
      return def;
    }
  }
};

export const multerOptions: MulterOptions = {
  // Enable file size limits
  limits: {
    fileSize: FileUploadUtil.getLimitFileSize(uploadConfig().limitBodySizeUpload),
  },
  fileFilter: (req, file, cb) => {
    const ext = FileUploadUtil.getFileTypeFromFileName(file.originalname);
    if (!FileUploadUtil.isValidFileType(ext)) {
      req.uploadError = {
        error: true,
        msg: `${file.originalname} is not allowed!`
      };
      return cb(null, false);
    }
    if (req.files && req.files.length > maxFile) {
      req.uploadError = {
        error: true,
        msg: `Maximum file count exceeded. Only ${maxFile} files are allowed.`
      };
      return cb(null, false);
    }
    return cb(null, true);
  }
};