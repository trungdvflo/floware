import { Injectable } from '@nestjs/common';
import { GetDownloadDto } from '../../modules/comment-attachment/dtos/download.get.dto';
import { CreateFileDTO } from '../../modules/comment-attachment/dtos/upload.create.dto';
import { DeepPartial, DeleteResult, FindOptionsWhere, Repository } from 'typeorm';
import { SHARE_STATUS } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { CollectionActivity } from '../entities/collection-activity.entity';
import { CollectionComment } from '../entities/collection-comment.entity';
import { FileCommon } from '../entities/file-common.entity';
import { LinkedFileCommon } from '../entities/linked-file-common.entity';
import { IUser } from '../interfaces';
import { getPlaceholderByN } from '../utils/common';
import { DeleteFileDTO } from '../../modules/comment-attachment/dtos/delete.dto';
import { MSG_ERR_DOWNLOAD } from '../constants/message.constant';

@Injectable()
@CustomRepository(FileCommon)
export class FileCommonRepository extends Repository<FileCommon> {
  async checkRoleDownload(params: GetDownloadDto, user: IUser) {
    const aliasName = 'File';
    const selectFields = [`${aliasName}.id id`,
      `${aliasName}.user_id user_id`,
      `${aliasName}.uid uid`,
      `${aliasName}.filename filename`,
      `${aliasName}.dir dir`,
      `${aliasName}.ext ext`,
      `${aliasName}.size size`];
    const query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin(LinkedFileCommon, 'link', `${aliasName}.id = link.file_common_id`)
      .innerJoin(CollectionComment, 'cm', `link.source_id = cm.id`)
      .leftJoin(CollectionActivity, 'ca', `cm.collection_activity_id = ca.id`)
      .leftJoin("collection_shared_member", 'csm', `(csm.collection_id = ca.collection_id
        AND csm.shared_status = :sharedStatus)`, { sharedStatus: SHARE_STATUS.JOINED })
      .where(`(${aliasName}.uid = :Uid)
        AND (${aliasName}.user_id = :userId
          OR csm.member_user_id = :userId)`  // for member
          , { userId: user.userId, Uid: params.uid });

    const rs = await query.getRawOne();
    return rs;
  }

  async checkRoleUpload(params: CreateFileDTO, user: IUser): Promise<number> {
    const res = await this.manager
      .query(`SELECT collection_checkPermissionComment(${getPlaceholderByN(4)}) as role`, [
        params.source_id,
        0,
        null,
        user.userId
      ]);

      return (res && res[0] && res[0].role)? res[0].role : -2;
  }

  async checkRoleDelete(params: DeleteFileDTO, user: IUser) {
    const aliasName = 'File';
    const selectFields = [`${aliasName}.id id`,
      `${aliasName}.user_id user_id`,
      `${aliasName}.uid uid`,
      `${aliasName}.filename filename`,
      `${aliasName}.dir dir`,
      `${aliasName}.ext ext`,
      `${aliasName}.size size`];
    const query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin(LinkedFileCommon, 'link', `${aliasName}.id = link.file_common_id`)
      .innerJoin(CollectionComment, 'cm', `link.source_id = cm.id`)
      .where(`(${aliasName}.uid = :Uid)
        AND (${aliasName}.user_id = :userId
          OR cm.user_id = :userId)`  // for member (owner)
          , { userId: user.userId, Uid: params.uid });

    const rs = await query.getRawOne();
    return rs;
  }

  async createFileAndLinked(entityPart: DeepPartial<FileCommon>,
    source_id: number, source_type: string): Promise<FileCommon> {
    const data = await this.save(entityPart);
    const res = await this.manager
      .query(`INSERT INTO linked_file_common
      (user_id, source_id, source_type, file_common_id, created_date, updated_date)
      VALUES (${getPlaceholderByN(6)})`, [
        entityPart.user_id,
        source_id,
        source_type,
        entityPart.id,
        entityPart.created_date,
        entityPart.updated_date
      ]);
    return data;
  }

  async deleteFileAndLinked(optionsWhere: FindOptionsWhere<FileCommon>): Promise<DeleteResult> {
    const data = await this.delete(optionsWhere);
    const res = await this.manager
      .query(`DELETE FROM linked_file_common
      WHERE (file_common_id = ?)`, [
        optionsWhere.id,
      ]);
    return data;
  }

  getErrorMessageByCode(code: number) {
    let msg = ERROR_CODE_MESSAGES[code];
    if (!msg) msg = MSG_ERR_DOWNLOAD.ITEM_CAN_NOT_UL;
    return ERROR_CODE_MESSAGES[code];
  }
}

const ERROR_CODE_MESSAGES = {
  '-4': 'The collection was trashed or deleted',
  '-3': 'Not allow change comment from the other',
  '-2': 'Do not have edit right: access denied',
  '-1': 'The collection is not shared',
  '0': 'The comment not found',
};
