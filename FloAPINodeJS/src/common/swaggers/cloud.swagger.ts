export const nameSwagger = 'Cloud';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  bookmark_data: {
    example: 'Ym9vazwDAAAAAAQQMAAAAJy2yEyU9',
    description: 'Contain binary bookmark local data from app (just for Flo Mac)'
  },
  real_filename: {
    required: false,
    example: 'Screenshot_2018-02-22_11-08-14.png',
    description:'Real file name when user upload from local'
  },
  ext: {
    required: false,
    example: 'png',
    description: 'Contain extension of the file'
  },
  device_uid: {
    required: false,
    example: 'D735AC90-F13C-4F68-AFC4-92D23B1C830B',
    description: 'Obtain UUID of the device to know this file upload from where'
  },
  size: {
    required: false,
    example: 123456,
    description: 'size of file - bytes'
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBodyUpdate = {
  "id": 1,
  "bookmark_data": RequestParam.bookmark_data.example,
  "real_filename": RequestParam.real_filename.example,
  "ext": RequestParam.ext.example,
  "device_uid": RequestParam.device_uid.example,
  "ref": RequestParam.ref.example,
  "size": RequestParam.size.example
};

export const requestBody = {
  "bookmark_data": RequestParam.bookmark_data.example,
  "real_filename": RequestParam.real_filename.example,
  "ext": RequestParam.ext.example,
  "device_uid": RequestParam.device_uid.example,
  "ref": RequestParam.ref.example,
  "size": RequestParam.size.example
};
