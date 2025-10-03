import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { GetAllAPIOptions } from "../../modules/database/database-utilities.service";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { ConferenceChatEntity } from "../entities/conference-chat.entity";
import { ConferenceMemberEntity } from "../entities/conference-member.entity";
import { FileCommon } from "../entities/file-common.entity";
import { LinkedFileCommon } from "../entities/linked-file-common.entity";

@Injectable()
@CustomRepository(ConferenceChatEntity)
export class ConferenceChatRepository extends Repository<ConferenceChatEntity> {
  async getAllConferenceChat(options: GetAllAPIOptions<any>) {
    const { userId, filter } = options;
    const { modified_gte, modified_lt, min_id, page_size, ids, fields } = filter;

    const aliasName = 'cc';
    const allFields = [
    `${aliasName}.id id`,
    `${aliasName}.conference_member_id conference_member_id`,
    `${aliasName}.message_uid message_uid`,
    `${aliasName}.message_text message_text`,
    `${aliasName}.message_type message_type`,
    `${aliasName}.created_date created_date`,
    `${aliasName}.updated_date updated_date`,
    'cm.channel_id channel_id',
    'lfc.file_common_id file_id',
    ];

    let selectFields = [];
    if (fields && fields.length > 0) {
      fields.forEach(f => {
        const field = f.toString();
        let index = allFields.indexOf(`${aliasName}.${field} ${field}`);
        if (index < 0) {
          index = allFields.indexOf(`cm.${field} ${field}`);
        }
        if (index >= 0) {
          selectFields.push(allFields[index]);
        }
      });
    } else {
      selectFields = allFields;
    }

    let query = this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(ConferenceMemberEntity, 'cm', `cm.id = ${aliasName}.conference_member_id`)
      .leftJoin(LinkedFileCommon, 'lfc', `lfc.source_id = ${aliasName}.id`)
      .where(`(${aliasName}.user_id = :userId)`, { userId });
    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${aliasName}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${aliasName}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${aliasName}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${aliasName}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasName}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasName}.id`, "ASC");
    }
    if(ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }

    const rs = await query.limit(page_size).getRawMany();
    return rs.map(r => {
      if (r.message_uid) {
        r.message_uid = r.message_uid.toString();
      }
      return r;
    });
  }

  async getFileDownloadByMessageUID(messageUid: string) {
    const aliasName = 'cc';
    const selectFields = [
      'fc.id id',
      'fc.uid uid',
      'fc.dir dir',
      'fc.ext ext',
      'fc.size size',
    ];

    const query = this.createQueryBuilder(aliasName)
      .select(selectFields)
      .leftJoin(LinkedFileCommon, 'lfc', `lfc.source_id = ${aliasName}.id`)
      .leftJoin(FileCommon, 'fc', `fc.id = lfc.file_common_id`)
      .where(`(${aliasName}.message_uid = :messageUid)`, { messageUid });

    const rs = await query.getRawOne();
    return rs;
  }
}