import { Injectable } from "@nestjs/common";
import {
  CLEAN_INVALID_LINKS_4_USER,
  COLLECT_INVALID_LINKS_4_USER,
  COLLECT_INVALID_LINK_TO_EMAIL,
  GET_LIST_EMAIL_LINKS_4_USER,
  GET_LIST_INVALID_LINK,
  GET_LIST_USER_TO_SCAN_EMAIL_LINK,
  GET_LIST_USER_TO_SCAN_OBJECT_LINK,
  REMOVE_FIL_CONSIDERING,
  REMOVE_SINGLE_INVALID_LINKS,
  UPDATE_USER_PROCESS_INVALID_DATA
} from "../constants/mysql.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { EmailObjectId } from "../dtos/object-uid";
import {
  ICollectObject4User,
  IEmailCollector,
  IEmailDeletion, IEmailObject, IObjectInvalid, IUserProcess
} from "../interface/invalid-data.interface";
import { FloInvalidLinkEntity } from "../models/flo-invalid-link.entity";
import { getPlaceholderByN } from "../utils/common";
import { BaseRepository } from "./base.repository";
@Injectable()
@CustomRepository(FloInvalidLinkEntity)
export class FloInvalidLinkRepository extends BaseRepository<FloInvalidLinkEntity> {

  /**
   * FUNCTION `f2023_removeFILConsidering`(pvObjectUid   varbinary(1000)
   *                                       ,pnUserID      bigint(20)
   *                                       ,pvEmail       varchar(255)
   *                                       )
   */
  async removeFILConsidering({ email, uid, path }: IEmailDeletion,
    objectEmailUid: Buffer = null): Promise<number> {
    if (!objectEmailUid && (!email || !uid || !path)) {
      return null;
    }
    const { spName, spParam } = REMOVE_FIL_CONSIDERING;
    const emailBuffer = objectEmailUid || new EmailObjectId({ uid, path }).objectUid;
    const saved = await this.manager
      .query(`SELECT ${spName}(${getPlaceholderByN(spParam)})`, [
        emailBuffer,
        null,
        email
      ]);
    return saved[0] || 0;
  }

  /**
   * PROCEDURE `f2023_collectInvalidLinkToEmail`(pvObjectUid   varbinary(1000)
   *                                                                ,pnUserID      bigint(20)
   *                                                                ,pvEmail       varchar(255)
   *                                                                ,pnConsidering   tinyint(1)
   *                                                                )
   */
  async collectInvalidLinkToEmail(
    { email, uid, path }: IEmailDeletion,
    objectEmailUid: Buffer = null, considering = 0): Promise<IEmailCollector> {
    if (!objectEmailUid && (!email || !uid || !path)) {
      return null;
    }
    const { spName, spParam } = COLLECT_INVALID_LINK_TO_EMAIL;
    const emailBuffer = objectEmailUid || new EmailObjectId({ uid, path }).objectUid;

    const saved = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        emailBuffer,
        null,
        email,
        considering
      ]);
    const oReturn: IEmailCollector = saved[0][0] || {};
    return oReturn;
  }
  /**
   * PROCEDURE `f2023_getListInvalidLink`(pnOffset      INT
   *                                                            ,pnLimit       INT)
   */
  async getListInvalidLink(offset = 0, limit = 200): Promise<IObjectInvalid[]> {
    const { spName, spParam } = GET_LIST_INVALID_LINK;

    const raw = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        +process.env.INVALID_INTERVAL_COLLECT_HOUR || 24,
        offset,
        limit
      ]);

    const lsObj: IObjectInvalid[] = !raw.length ? [] : raw[0];
    return lsObj;
  }
  /**
   * PROCEDURE `f2023_getListUserToScanEmailLink`(pnOffset      int
   *                                             ,pnLimit       int)
   */
  async getListUserToScanEmailLink(offset = 0, limit = 200): Promise<IUserProcess[]> {
    const { spName, spParam } = GET_LIST_USER_TO_SCAN_EMAIL_LINK;
    const rawUsers = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        +process.env.INVALID_INTERVAL_COLLECT_HOUR || 24,
        offset,
        limit
      ]);
    const listUsers: IUserProcess[] = !rawUsers.length ? [] : rawUsers[0];
    return listUsers;
  }

  /**
   * PROCEDURE `f2023_getListUserToScanFloObject`(pnOffset      int
   *                                              ,pnLimit       int)
   */
  async getListUserToScanFloObject(offset = 0, limit = 200): Promise<IUserProcess[]> {
    const { spName, spParam } = GET_LIST_USER_TO_SCAN_OBJECT_LINK;
    const rawUsers = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        +process.env.INVALID_INTERVAL_COLLECT_HOUR || 24,
        offset,
        limit
      ]);
    const listUsers: IUserProcess[] = !rawUsers.length ? [] : rawUsers[0];
    return listUsers;
  }
  /**
   * PROCEDURE `f2023_getListEmailLinks4User`(pnUserId       bigint(2)
   *                                             ,pvEmail       varchar(255))
   */
  async getListEmailLinks4User(usr: IUserProcess): Promise<IEmailObject[]> {
    const { spName, spParam } = GET_LIST_EMAIL_LINKS_4_USER;

    const rawEmails = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        usr.user_id, usr.username
      ]);
    const listEmails: IEmailObject[] = !rawEmails.length ? [] : rawEmails[0];
    return listEmails.filter(({ object_uid }) => Boolean(object_uid));
  }

  /**
   * FUNCTION `f2023_updateUserProcessInvalidDataV2`
   * (pnID              BIGINT(20)
   * ,pnUserId          BIGINT(20)
   * ,pvEmail           VARCHAR(255)
   * ,pnObjScanned      TINYINT(1) -- update after scan success
   * ,pnEmailScanned    TINYINT(1) -- update after scan success
   * ,pnObjScanning     TINYINT(1) -- update before start scan
   * ,pnEmailScanning   TINYINT(1) -- update before start scan
   * ) RETURNS bigint(20)
   */
  async updateUserProcessInvalidData(usr: IUserProcess): Promise<number> {
    const { spName, spParam } = UPDATE_USER_PROCESS_INVALID_DATA;
    const saved = await this.manager
      .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) nID`, [
        0,
        usr.user_id,
        usr.username,
        +usr.objScanned || 0,
        +usr.emailScanned || 0,
        +usr.objScanning || 0,
        +usr.emailScanning || 0
      ]);
    return saved[0]?.nID || 0;
  }
  /**
   * PROCEDURE `f2023_collectInvalidLinks4User`(pvObjectUid   varbinary(1000)
   *                                           ,pvObjectType  varbinary(50)
   *                                           ,pnUserID      bigint(20)
   *                                           ,pvEmail       varchar(255))
   */
  async collectInvalidLinks4User(lastResult: ICollectObject4User, usr: IUserProcess)
    : Promise<ICollectObject4User> {
    const { spName, spParam } = COLLECT_INVALID_LINKS_4_USER;

    const rawEmails = await this.manager
      .query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        lastResult,
        null,
        null,
        usr.user_id,
        usr.username
      ]);
    const result = !rawEmails.length ? [] : rawEmails[0][0];
    return result;
  }

  /**
   * FUNCTION f2023_removeSingleInvalidLinks`(pnID        BIGINT(20)
   *                                         ,pnLinkID    BIGINT(20)
   *                                         ,pvLinkType  VARCHAR(45)
   *                                         ,pnUserId    BIGINT(20)) RETURNS int(11)
   */
  async removeSingleInvalidLinks(input: IObjectInvalid): Promise<number> {
    const { spName, spParam } = REMOVE_SINGLE_INVALID_LINKS;
    const saved = await this.manager
      .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) nReturn`, [
        input.id,
        input.link_id,
        input.link_type,
        input.user_id
      ]);
    return saved[0]?.nReturn || 0;
  }

  /**
   * FUNCTION f2023_cleanInvalidLinks4User`(pnID BIGINT(20)
   *                              ,pvObjectUid   VARBINARY(1000)
   *                              ,pvObjectType  VARBINARY(50)
   *                              ,pnUserID  BIGINT(20)
   */
  async cleanInvalidLinks4User(input: IObjectInvalid): Promise<number> {
    const { spName, spParam } = CLEAN_INVALID_LINKS_4_USER;
    const saved = await this.manager
      .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) nCount`, [
        input.id,
        input.object_uid,
        input.object_type,
        input.user_id
      ]);
    return saved[0]?.nCount || 0;
  }

  async updateProcess(ids: number[]) {
    // update processing
    return await this
      .createQueryBuilder()
      .update(FloInvalidLinkEntity)
      .set({ is_processing: 1 })
      .where('id IN (:...ids)', { ids })
      .execute();
  }
}