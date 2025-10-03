import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CustomRepository } from "../../common/decorators/typeorm-ex.decorator";
import { FileCommon } from "../entities";
import { LinkedFileCommon } from "../entities/linked-file-common.entity";

@Injectable()
@CustomRepository(LinkedFileCommon)
export class LinkFileRepository extends Repository<LinkedFileCommon> {

  async getFileByFileID(fileId: number) {
    const aliasName = 'lfc';
    const selectFields = [
      'fc.id id',
      'fc.uid uid',
      'fc.dir dir',
      'fc.ext ext',
      'fc.size size',
    ];
    const rs = await this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(FileCommon, 'fc', `fc.id = lfc.file_common_id`)
      .where(`(${aliasName}.file_common_id = :fileId)`, { fileId })
      .getRawOne();
    return rs;
  }

  async getFileByChanleIdAndTimeDownload(f_uid: string, channelId: number, timeJoined: number) {
    const aliasName = 'lfc';
    const selectFields = [
      'fc.id id',
      'fc.filename filename',
      'fc.mime mime',
      'fc.uid uid',
      'fc.dir dir',
      'fc.ext ext',
      'fc.size size',
    ];
    const queryBuilder = this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(FileCommon, 'fc', `fc.id = lfc.file_common_id`)
      .where(`uid = :f_uid`, { f_uid })
      .andWhere(`(${aliasName}.source_id = :channelId)`, { channelId });
    if (timeJoined > 0) {
      queryBuilder.andWhere(`fc.created_date > :timeJoined`, { timeJoined });
    }
    return await queryBuilder.getRawOne();
  }

  async getFileByFileIDAndChannelId(f_uid: string, channelId: number) {
    const aliasName = 'lfc';
    const selectFields = [
      'fc.id id',
      'fc.filename filename',
      'fc.mime mime',
      'fc.uid uid',
      'fc.dir dir',
      'fc.ext ext',
      'fc.size size',
    ];
    const rs = await this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(FileCommon, 'fc', `fc.id = lfc.file_common_id`)
      .where(`uid = :f_uid`, { f_uid })
      .andWhere(`(${aliasName}.source_id = :channelId)`, { channelId })
      .getRawOne();
    return rs;
  }

  async getFileDownloadByMessageUID(messageUid: string) {
    const aliasName = 'lfc';
    const selectFields = [
      'fc.id id',
      'fc.uid uid',
      'fc.dir dir',
      'fc.ext ext',
      'fc.size size',
    ];
    const rs = await this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(FileCommon, 'fc', `fc.id = lfc.file_common_id`)
      .where(`(${aliasName}.source_uid = :messageUid)`, { messageUid })
      .getRawMany();
    return rs;
  }
}