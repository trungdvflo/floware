import { Injectable } from '@nestjs/common';
import { OBJ_TYPE } from '../../../common/constants/common';
import { Email365ObjectId, EmailObjectId, GeneralObjectId, GmailObjectId, LINK_OBJ_TYPE } from '../../../common/dtos/object-uid';
import { FloObjectUid } from '../../../common/types/object-uid';
@Injectable()
export class LinkHelper {
  static transformObjectUid(value: any, obj: any, type: string): FloObjectUid {
    if (!value) return value;
    if (obj[type] === OBJ_TYPE.EMAIL) {
      if (typeof value !== 'object') return value;
      return new EmailObjectId({ uid: value.uid, path: value.path });
    }
    if (obj[type] === OBJ_TYPE.GMAIL) {
      if (typeof value !== 'string') return value;
      return new GmailObjectId({ gmailId: value });
    }
    if (obj[type] === OBJ_TYPE.EMAIL365) {
      if (typeof value !== 'string') return value;
      return new Email365ObjectId({ id: value });
    }
    if (typeof value !== 'string' || !value) return value;
    return new GeneralObjectId({ uid: value }, obj[type]);
  }
  static getObjectUid(value: Buffer, type: LINK_OBJ_TYPE): string | object {
    if (type === OBJ_TYPE.EMAIL) {
      return new EmailObjectId({ emailBuffer: value }).getPlain();
    }
    if (type === OBJ_TYPE.GMAIL) {
      try {
        return new GmailObjectId({ encryptedGmailIdBuf: value }).getPlain();
      } catch (error) {
        return '';
      }
    }
    if (type === OBJ_TYPE.EMAIL365) {
      try {
        return new Email365ObjectId({ encryptedIdBuf: value }).getPlain();
      } catch (error) {
        return '';
      }
    }
    return new GeneralObjectId({ uidBuffer: value }, type).getPlain();
  }
}
