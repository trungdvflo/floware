import { IsDefined, IsInt, IsNotEmpty, IsString, Min } from "class-validator";
import { OBJ_TYPE } from "../constants/common";
import { CryptoUtil } from "../utils/crypto.util";

export type GENERAL_OBJ = OBJ_TYPE.VTODO | OBJ_TYPE.VEVENT | OBJ_TYPE.CHAT |
  OBJ_TYPE.VJOURNAL | OBJ_TYPE.VCARD | OBJ_TYPE.URL | OBJ_TYPE.CSFILE
  | OBJ_TYPE.CONFERENCING | OBJ_TYPE.SCHEDULE_CALL;
export type LINK_OBJ_TYPE = GENERAL_OBJ | OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365;

export const LINK_OBJ_TYPE_ARRAY = [
  OBJ_TYPE.VTODO,
  OBJ_TYPE.VEVENT,
  OBJ_TYPE.VJOURNAL,
  OBJ_TYPE.VCARD,
  OBJ_TYPE.URL,
  OBJ_TYPE.CSFILE,
  OBJ_TYPE.EMAIL,
  OBJ_TYPE.GMAIL,
  OBJ_TYPE.EMAIL365,
  OBJ_TYPE.CONFERENCING,
  OBJ_TYPE.CHAT,
  OBJ_TYPE.SCHEDULE_CALL,
  OBJ_TYPE.CONFERENCE_HISTORY
];

export const GENERAL_OBJ_TYPE_ARRAY = [
  OBJ_TYPE.VTODO,
  OBJ_TYPE.VEVENT,
  OBJ_TYPE.VJOURNAL,
  OBJ_TYPE.VCARD,
  OBJ_TYPE.URL,
  OBJ_TYPE.CSFILE,
  OBJ_TYPE.CONFERENCING,
  OBJ_TYPE.SCHEDULE_CALL,
  OBJ_TYPE.CONFERENCE_HISTORY];

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
    objectType: GENERAL_OBJ | OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365):
    Email365ObjectId | GmailObjectId | EmailObjectId | GeneralObjectId | undefined {
    if (objectType === OBJ_TYPE.GMAIL) {
      if (typeof input === 'string') return new GmailObjectId({ gmailId: input });
      if (input instanceof Buffer) return new GmailObjectId({ encryptedGmailIdBuf: input });
    } else if (objectType === OBJ_TYPE.EMAIL365) {
      if (typeof input === 'string') return new Email365ObjectId({ id: input });
      if (input instanceof Buffer) return new Email365ObjectId({ encryptedIdBuf: input });
    } else if (objectType === OBJ_TYPE.EMAIL) {
      if (input instanceof EmailObjectPlain) return new EmailObjectId(input);
      if (input instanceof Buffer) return new EmailObjectId({ emailBuffer: input });
    } else {
      if (typeof input === 'string') return new GeneralObjectId({ uid: input }, objectType);
      if (input instanceof Buffer) return new GeneralObjectId({ uidBuffer: input }, objectType);
      return undefined;
    }
  }
}
export class EmailObjectId extends ObjectId {
  private readonly _type: OBJ_TYPE.EMAIL;

  get type() {
    return this._type;
  }

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(1)
  public uid: number;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public path: string;

  public uidValidity: number;

  get objectUid(): Buffer {
    try {
      const uidBuf = Buffer.alloc(8);
      uidBuf.writeUInt32BE(this.uid);
      const pathBuf = Buffer.from(this.path);
      return Buffer.concat([uidBuf, pathBuf]);
    } catch (e) {
      return null;
    }
  }

  set objectUid(value: Buffer) {
    try {
      const uidBuf = Buffer.alloc(8);
      value.copy(uidBuf, 0, 0, 8);
      const pathBuf = Buffer.alloc(value.length - uidBuf.length);
      value.copy(pathBuf, 0, 8, value.length);
      this.uid = uidBuf.readUInt32BE();
      this.path = pathBuf.toString();
    } catch (e) {
      throw e;
    }
  }

  constructor({ uid, path, emailBuffer }: { uid?: number, path?: string, emailBuffer?: Buffer }) {
    super();
    this.uid = uid;
    this.path = path;
    if (emailBuffer) {
      this.objectUid = emailBuffer;
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

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  uid: string;

  get objectUid(): Buffer {
    return Buffer.from(this.uid);
  }

  set objectUid(value: Buffer) {
    this.uid = value.toString();
  }

  constructor({ uid, uidBuffer }: { uid?: string, uidBuffer?: Buffer }, objType?: GENERAL_OBJ) {
    super();
    this._type = objType;
    this.uid = uid;
    if (uidBuffer) {
      this.objectUid = uidBuffer;
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

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public id: string;

  get objectUid(): Buffer {
    try {
      return CryptoUtil.aes256EncryptBuffer(
        this.id, process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
    } catch (error) {
      return Buffer.from(this.id);
    }
  }

  set objectUid(value: Buffer) {
    try {
      this.id = CryptoUtil.aes256DecryptBuffer(
        value, process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
    } catch (error) {
      this.id = value.toString();
    }
  }

  constructor({ gmailId, encryptedGmailIdBuf }:
    { gmailId?: string, encryptedGmailIdBuf?: Buffer }) {
    super();
    this.id = gmailId;
    if (encryptedGmailIdBuf) {
      this.objectUid = encryptedGmailIdBuf;
    }
  }

  getPlain() {
    return this.id;
  }
}

export class Email365ObjectId extends ObjectId {
  private readonly _type: OBJ_TYPE.EMAIL365;

  get type() {
    return this._type;
  }

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  public id: string;

  get objectUid(): Buffer {
    try {
      return CryptoUtil.aes256EncryptBuffer(
        this.id, process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
    } catch (error) {
      return Buffer.from(this.id);
    }
  }

  set objectUid(value: Buffer) {
    try {
      this.id = CryptoUtil.aes256DecryptBuffer(
        value, process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
    } catch (error) {
      this.id = value.toString();
    }
  }

  constructor({ id, encryptedIdBuf }:
    { id?: string, encryptedIdBuf?: Buffer }) {
    super();
    this.id = id;
    if (encryptedIdBuf) {
      this.objectUid = encryptedIdBuf;
    }
  }

  getPlain() {
    return this.id;
  }
}
