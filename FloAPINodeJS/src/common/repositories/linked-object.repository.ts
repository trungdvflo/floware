import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { FindBaseObjectOptions } from "../../modules/database/database-utilities.service";
import { IS_TRASHED, OBJ_TYPE } from "../constants";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { GetLinkedPaging } from "../dtos/get-all-filter";
import { EmailObjectId } from "../dtos/object-uid";
import { ConferenceChannelEntity } from "../entities/conference-channel.entity";
import { ConferenceMemberEntity } from "../entities/conference-member.entity";
import { LinkedObject } from "../entities/linked-object.entity";
import { CryptoUtil } from "../utils/crypto.util";
import { filterGetAllFields } from "../utils/typeorm.util";
interface GetAllAPIOptions<T> extends FindBaseObjectOptions<T> {
  filter: GetLinkedPaging<T>;
}

@Injectable()
@CustomRepository(LinkedObject)
export class LinkedObjectRepository extends Repository<LinkedObject> {
  async getLinkedSupportChannel(options: GetAllAPIOptions<any>) {
    const { modified_gte, modified_lt, min_id, page_size, ids,
      remove_deleted, channel_id, object_type, object_uid, uid, path }
      = options.filter;
    const { repository, userId } = options;
    const fields = filterGetAllFields(repository, options.filter.fields);
    const aliasName = repository.metadata.name || 'model';
    let emailUid = null;
    let query = repository
      .createQueryBuilder(aliasName)
      .select(fields && fields.length > 0 && fields.map(f => `${aliasName}.${String(f)}`))
      .where(`${aliasName}.user_id = :userId`, { userId });

    if (channel_id) {

      query.innerJoin(ConferenceChannelEntity, "cc", `${aliasName}.source_object_uid = cc.uid OR ${aliasName}.destination_object_uid = cc.uid`)
        .innerJoin(ConferenceMemberEntity, "cm", `cc.id = cm.channel_id and ${aliasName}.user_id = cm.user_id`)
        .andWhere(`cm.channel_id = :channelId`, { channelId: channel_id });
    }
    if (object_type) {
      query.andWhere(`(${aliasName}.source_object_type = :objectType
      OR ${aliasName}.destination_object_type = :objectType)`, { objectType: object_type });
      if (object_type === OBJ_TYPE.EMAIL && uid && path) {
        emailUid = new EmailObjectId({ uid, path });
      }
    } else if (channel_id) {
      query.andWhere(`(${aliasName}.source_object_type = :objectType
      OR ${aliasName}.destination_object_type = :objectType)`,
        { objectType: OBJ_TYPE.CONFERENCING });
    }

    if (emailUid) {
      query.andWhere(`${aliasName}.source_object_uid = :objectUid
      OR ${aliasName}.destination_object_uid = :objectUid`, { objectUid: emailUid.objectUid });
    }

    if (object_uid) {
      let objectUid = null;
      if ([OBJ_TYPE.GMAIL, OBJ_TYPE.EMAIL365].includes(object_type)) {
        objectUid = CryptoUtil.aes256EncryptBuffer(
          object_uid.getPlain(), process.env.FLO_AES_KEY, process.env.FLO_AES_IV_KEY);
      } else {
        objectUid = object_uid.getPlain();
      }

      query.andWhere(`${aliasName}.source_object_uid = :objectUid
      OR ${aliasName}.destination_object_uid = :objectUid`, { objectUid });
    }

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
    if (ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }

    if (remove_deleted &&
      repository.metadata.ownColumns.find(c => c.databaseName === 'is_trashed')) {
      query =
        query.andWhere(
          `${aliasName}.is_trashed != :is_trashed`, { is_trashed: IS_TRASHED.DELETED });
    }

    return query.limit(page_size).getMany();
  }
}