import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { IFileCommonJob, IFileCommonObjectJob } from "../interface/file-attachment.interface";
import { FileCommonEntity } from "../models/file-common.entity";
import { LinkedFileCommonEntity } from "../models/linked-file-common.entity";
import { BaseRepository } from "./base.repository";
export type ILinkedFileCommonPayload = {
  userId: number;
  linkId: number;
  fileId: number;
  uid: string;
  ext: string;
  size: number;
  collection_id: number;
};
@Injectable()
@CustomRepository(FileCommonEntity)
export class FileCommonRepository extends BaseRepository<FileCommonEntity> {

  async getAllFiles(src: IFileCommonJob): Promise<ILinkedFileCommonPayload[]> {
    const fc = 'fc';
    const lfc = 'lfc';
    return await this.createQueryBuilder(fc)
      .select([
        `${lfc}.id linkId
        , ${lfc}.file_common_id fileId
        , ${fc}.user_id userId
        , ${fc}.uid uid
        , ${fc}.ext ext
        , ${fc}.size size`
      ])
      .innerJoin(LinkedFileCommonEntity, lfc, `${fc}.id=${lfc}.file_common_id`)
      .where(`${lfc}.source_type = :source_type`, { source_type: src.source_type })
      .andWhere(`${lfc}.source_id = :source_id`, { source_id: src.source_id })
      //  .andWhere(`${lfc}.user_id = :user_id`, { user_id: src.user_id })
      .getRawMany();
  }

  async getFilesCommentOfObject(src: IFileCommonObjectJob)
  : Promise<ILinkedFileCommonPayload[]> {
    const fc = 'fc';
    const lfc = 'lfc';
    const cc = 'cc';
    const ca = 'ca';
    let query = this.createQueryBuilder(fc)
      .select([
        `${lfc}.id linkId
        , ${lfc}.file_common_id fileId
        , ${fc}.user_id userId
        , ${fc}.uid uid
        , ${fc}.ext ext
        , ${fc}.size size
        , ${ca}.collection_id collection_id`
      ])
      .innerJoin(LinkedFileCommonEntity, lfc, `${fc}.id=${lfc}.file_common_id`)
      .innerJoin('collection_comment', cc, `${cc}.id=${lfc}.source_id`)
      .innerJoin('collection_activity', ca, `${ca}.id=${cc}.collection_activity_id`);

    query = query.where(`${ca}.object_type = :object_type`, { object_type: src.object_type });
    query = query.andWhere(`${ca}.object_uid = :object_uid`, { object_uid: src.object_uid });

      return await query.getRawMany();
  }

}