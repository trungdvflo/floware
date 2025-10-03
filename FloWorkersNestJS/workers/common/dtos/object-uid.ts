import { MSG_ERR_INPUT_INVALID } from "../constants/message.constant";
import { OBJ_TYPE } from "../constants/sort-object.constant";
import { aes256DecryptBuffer, aes256EncryptBuffer } from "../utils/crypto.util";

export type GENERAL_OBJ =
  OBJ_TYPE.VTODO |
  OBJ_TYPE.VEVENT |
  OBJ_TYPE.VJOURNAL |
  OBJ_TYPE.VCARD |
  OBJ_TYPE.URL |
  OBJ_TYPE.CSFILE;

export const LINK_OBJ_TYPE_ARRAY = [
  OBJ_TYPE.VTODO,
  OBJ_TYPE.VEVENT,
  OBJ_TYPE.VJOURNAL,
  OBJ_TYPE.VCARD,
  OBJ_TYPE.URL,
  OBJ_TYPE.CSFILE,
  OBJ_TYPE.EMAIL,
  OBJ_TYPE.GMAIL
];

export const GENERAL_OBJ_TYPE_ARRAY = [
  OBJ_TYPE.VTODO,
  OBJ_TYPE.VEVENT,
  OBJ_TYPE.VJOURNAL,
  OBJ_TYPE.VCARD,
  OBJ_TYPE.URL,
  OBJ_TYPE.CSFILE,
];

export class EmailObjectPlain {
  uid: number;
  path: string;
  constructor(data: EmailObjectPlain) {
    Object.assign(this, data);
  }
}

export abstract class ObjectId {
  abstract type: OBJ_TYPE;
  abstract objectUid: Buffer;
  abstract getPlain();

  static ObjectIdFactory(input: string | EmailObjectPlain | Buffer,
    objectType: GENERAL_OBJ | OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL):
    GmailObjectId | EmailObjectId |  GeneralObjectId | undefined  {
    if(objectType === OBJ_TYPE.GMAIL) {
      if(typeof input === 'string') return new GmailObjectId({ gmailId: input });
      if(input instanceof Buffer) return new GmailObjectId({ encryptedGmailIdBuf: input });
    } else if(objectType === OBJ_TYPE.EMAIL) {
      if(input instanceof EmailObjectPlain) return new EmailObjectId(input);
      if(input instanceof Buffer) return new EmailObjectId({ emailBuffer: input });
    } else {
      if(typeof input === 'string') return new GeneralObjectId({ uid: input }, objectType);
      if(input instanceof Buffer) return new GeneralObjectId({ uidBuffer: input }, objectType);
      return undefined;
    }
  }
}
export class EmailObjectId extends ObjectId {
  private readonly _type: OBJ_TYPE.EMAIL;

  get type() {
    return this._type;
  }

  public uid: number;
  public path: string;
  public uidValidity: number;

  get objectUid(): Buffer {
    const uidBuf = Buffer.alloc(8);
    uidBuf.writeUInt32BE(this.uid);
    const pathBuf = Buffer.from(this.path);
    return Buffer.concat([uidBuf, pathBuf]);
  }

  set objectUid(value: Buffer) {
    const uidBuf = Buffer.alloc(8);
    value.copy(uidBuf, 0, 0, 8);
    const pathBuf = Buffer.alloc(value.length - uidBuf.length);
    value.copy(pathBuf, 0, 8, value.length);
    this.uid = uidBuf.readUInt32BE();
    this.path = pathBuf.toString();
  }

  constructor({ uid, path, emailBuffer }: { uid?: number, path?: string, emailBuffer?: Buffer }) {
    super();
    if(uid && path) {
      this.uid = uid;
      this.path = path;
    } else if(emailBuffer) {
      this.objectUid = emailBuffer;
    } else {
      throw Error(MSG_ERR_INPUT_INVALID);
    }
  }

  getPlain() {
    return {
      uid: this.uid,
      path: this.path
    };
  }
}
export class GeneralObjectId extends ObjectId {
  private readonly _type: GENERAL_OBJ;

  get type() {
    return this._type;
  }

  uid: string;

  get objectUid(): Buffer {
    return Buffer.from(this.uid);
  }

  set objectUid(value: Buffer) {
    this.uid = value.toString();
  }

  constructor({ uid, uidBuffer }: { uid?: string, uidBuffer?: Buffer}, objType?: GENERAL_OBJ) {
    super();
    this._type = objType;
    if(uid) {
      this.uid = uid;
    } else if(uidBuffer) {
      this.objectUid = uidBuffer;
    }
    else {
      throw Error(MSG_ERR_INPUT_INVALID);
    }
  }

  getPlain() {
    return this.uid;
  }
}
export class GmailObjectId extends ObjectId {
  private readonly _type: OBJ_TYPE.GMAIL;

  get type() {
    return this._type;
  }

  public id: string;

  get objectUid(): Buffer {
    return aes256EncryptBuffer(
      this.id, process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
  }

  set objectUid(value: Buffer) {
    this.id = aes256DecryptBuffer(
        value, process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
  }

  constructor({ gmailId, encryptedGmailIdBuf }:
    { gmailId?: string, encryptedGmailIdBuf?: Buffer }) {
    super();
    if(gmailId) {
      this.id = gmailId;
    } else if(encryptedGmailIdBuf) {
      this.objectUid = encryptedGmailIdBuf;
    } else {
      throw Error(MSG_ERR_INPUT_INVALID);
    }
  }

  getPlain() {
    return this.id;
  }
}
