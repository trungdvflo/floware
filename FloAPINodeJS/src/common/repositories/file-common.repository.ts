import { Injectable } from '@nestjs/common';
import { DeepPartial, DeleteResult, FindOptionsWhere, Repository } from 'typeorm';
import { DeleteFileDTO } from '../../modules/comment-attachment/dtos/delete.dto';
import { GetDownloadDto } from '../../modules/comment-attachment/dtos/download.get.dto';
import { CreateFileDTO } from '../../modules/comment-attachment/dtos/upload.create.dto';
import { MEMBER_ACCESS, SHARE_STATUS } from '../constants';
import { ERR_COLLECTION_ACTIVITY, MSG_ERR_DOWNLOAD } from '../constants/message.constant';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { CollectionActivity } from '../entities/collection-activity.entity';
import { CollectionComment } from '../entities/collection-comment.entity';
import { FileCommon } from '../entities/file-common.entity';
import { LinkedFileCommon } from '../entities/linked-file-common.entity';
import { IUser } from '../interfaces';
import { getPlaceholderByN } from '../utils/common';
import { IS_TRASHED } from './../constants/common';

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
      `${aliasName}.size size`
    ];
    const query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin(LinkedFileCommon, 'link', `${aliasName}.id = link.file_common_id`)
      .innerJoin(CollectionComment, 'cm', `link.source_id = cm.id`)
      .innerJoin(CollectionActivity, 'ca', `cm.collection_activity_id = ca.id`)
      .leftJoin("collection", 'co', `co.id = ca.collection_id`)
      .leftJoin("collection_shared_member", 'csm', `(csm.collection_id = ca.collection_id
        AND csm.shared_status = :sharedStatus)`, { sharedStatus: SHARE_STATUS.JOINED })
      .where(`(${aliasName}.uid = :Uid)
        AND (ca.user_id = :userId
          OR (csm.member_user_id = :userId
            AND csm.shared_status = :sharedStatus
            AND co.is_trashed = :isTrash))
        `
          , {
            userId: user.userId
            , Uid: params.uid
            , sharedStatus: SHARE_STATUS.JOINED
            , isTrash: IS_TRASHED.NOT_TRASHED
          });

    const rs = await query.getRawOne();
    return rs;
  }

  // async checkRoleUpload(params: CreateFileDTO, user: IUser): Promise<number> {
  //   const res = await this.manager
  //     .query(`SELECT collection_checkPermissionComment(${getPlaceholderByN(4)}) as role`, [
  //       params.comment_id,
  //       0,
  //       null,
  //       user.userId
  //     ]);

  //     return (res && res[0] && res[0].role)? res[0].role : -2;
  // }

  async checkRoleUpload(params: CreateFileDTO, user: IUser): Promise<CollectionComment> {
    const aliasName = 'Comment';
    const selectFields = [`${aliasName}.id id`,
      `${aliasName}.user_id user_id`,
      `ca.collection_id collection_id`,
      `csm.shared_status shared_status`,
      `csm.access access`,
      `tc.id trash_id`,
      `co.is_trashed co_is_trashed`,
      `ca.user_id co_user_id`,
    ];
    const query = this.manager.getRepository(CollectionComment)
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin(CollectionActivity, 'ca', `${aliasName}.collection_activity_id = ca.id`)
      .leftJoin("collection", 'co', `co.id = ca.collection_id`)
      .leftJoin("trash_collection", 'tc', 'tc.object_uid = ca.object_uid')
      .leftJoin("collection_shared_member", 'csm', `(csm.collection_id = ca.collection_id
        )`)
      .where(`((csm.member_user_id = :userId OR ca.user_id = :userId)
          AND ${aliasName}.id = :commentId)
          `
          , { userId: user.userId, commentId: params.comment_id });

    const rs = await query.getRawOne();
    return rs;
  }

  async checkRoleDelete(params: DeleteFileDTO, user: IUser): Promise<FileCommon> {
    const aliasName = 'File';
    const selectFields = [`${aliasName}.id id`,
      `${aliasName}.user_id user_id`,
      `${aliasName}.uid uid`,
      `${aliasName}.filename filename`,
      `${aliasName}.dir dir`,
      `${aliasName}.ext ext`,
      `${aliasName}.size size`,
      `ca.collection_id collection_id`,
      `cm.id comment_id`,
      `csm.shared_status shared_status`,
      `csm.access access`,
      `tc.id trash_id`,
      `co.is_trashed co_is_trashed`,
      `ca.user_id co_user_id`,
    ];
    const query = this
      .createQueryBuilder(aliasName)
      .select(selectFields)
      .innerJoin(LinkedFileCommon, 'link', `${aliasName}.id = link.file_common_id`)
      .innerJoin(CollectionComment, 'cm', `link.source_id = cm.id`)
      .innerJoin(CollectionActivity, 'ca', `cm.collection_activity_id = ca.id`)
      .leftJoin("collection", 'co', `co.id = ca.collection_id`)
      .leftJoin("trash_collection", 'tc', 'tc.object_uid = ca.object_uid')
      .leftJoin("collection_shared_member", 'csm', `(csm.collection_id = ca.collection_id
        )`)
      .where(`(${aliasName}.uid = :Uid)
        AND ((csm.member_user_id = :userId) OR (ca.user_id = :userId))
        `
          , { userId: user.userId, Uid: params.uid });

    const rs = await query.getRawOne();
    return rs;
  }

  async createFileAndLinked(entityPart: DeepPartial<FileCommon>,
    source_id: number, source_type: string): Promise<FileCommon> {
    const data = await this.save(entityPart);
    data.id = Number(data.id);
    await this.manager
      .query(`INSERT INTO linked_file_common
      (user_id, source_id, source_type, file_common_id, created_date, updated_date)
      VALUES (${getPlaceholderByN(6)})`, [
        entityPart.user_id,
        source_id,
        source_type,
        data.id,
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

  async updateComment(id: number, updatedDate: number) {
    await this.manager
      .query(`UPDATE collection_comment SET updated_date = ? WHERE id =?`,
      [updatedDate, id]);
  }

  getErrorMessageByCode(code: number) {
    let msg = ERROR_CODE_MESSAGES[code];
    if (!msg) msg = MSG_ERR_DOWNLOAD;
    return ERROR_CODE_MESSAGES[code];
  }

  filterMessage(item, userId: number, defautMsg: string, forDelete?: boolean) {
    let error = false;
    let msg = defautMsg;
    if (item && item.id) {
      if (item.trash_id > 0) {
        error = true;
        msg = ERR_COLLECTION_ACTIVITY.OBJECT_TRASHED;
      } else if (item.co_user_id !== userId) { // members
        if (
          item.co_is_trashed !== IS_TRASHED.NOT_TRASHED
          || item.shared_status !== SHARE_STATUS.JOINED
          || item.access !== MEMBER_ACCESS.READ_WRITE) {
          error = true;
          msg = ERR_COLLECTION_ACTIVITY.COLLECTION_NOT_JOIN;
        } else if (item.user_id !== userId) {
          error = true;
          msg = ERR_COLLECTION_ACTIVITY.NOT_ALLOW_CHANGE_FILE;
        }
      } else if (item.co_user_id === userId) { // collection owner
        if (!forDelete && item.user_id !== userId) {
          error = true;
          msg = ERR_COLLECTION_ACTIVITY.NOT_ALLOW_UPDATE_FILE;
        }
      }
    } else {
      error = true;
    }
    return {
      error,
      msg
    };
  }
}

const ERROR_CODE_MESSAGES = {
  '-4': 'The collection was trashed or deleted',
  '-3': 'Not allow change comment from the other',
  '-2': 'Do not have edit right: access denied',
  '-1': 'The collection is not shared',
  '0': 'The comment not found',
};
