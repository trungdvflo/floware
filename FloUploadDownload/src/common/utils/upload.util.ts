import { BadRequestException } from "@nestjs/common";
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
  isValidFileType: (fileType: string) => {
    for (const [k, v] of Object.entries(FileAttachmentAcceptType)) {
      if (v.find((e) => e === fileType.toLowerCase())) return true;
    }
    return false;
  },
};
