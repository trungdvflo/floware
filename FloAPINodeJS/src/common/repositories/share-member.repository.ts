import { Injectable } from "@nestjs/common";
import { FindOneOptions } from "typeorm";
import { IS_TRASHED, MEMBER_ACCESS, SHARE_STATUS } from "../constants";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { ShareMember } from '../entities/share-member.entity';
import { CommonRepository } from "./common.repository";

export interface SharedMemberServiceOptions extends FindOneOptions<ShareMember> {
}
@Injectable()
@CustomRepository(ShareMember)
export class ShareMemberRepository extends CommonRepository<ShareMember> {

  async getOneMemberByMemberId(collection_id: number,
    member_user_id: number): Promise<ShareMember> {
    return await this.createQueryBuilder('csm')
      .select([
        'csm.id id', 'csm.user_id user_id', 'csm.collection_id collection_id',
        'csm.calendar_uri calendar_uri', 'csm.access access', 'csm.shared_status shared_status',
        'csm.shared_email shared_email', 'csm.member_user_id member_user_id',
        'csm.contact_uid contact_uid', 'csm.contact_href contact_href',
        'csm.account_id account_id', 'csm.created_date created_date', 'u.email email'
      ])
      .innerJoin('user', 'u', 'u.id = csm.user_id')
      .where('csm.collection_id = :collection_id', { collection_id })
      .andWhere('csm.member_user_id = :member_user_id', { member_user_id })
      .getRawOne();
  }

  async getOneByCollection(id: number, user_id: number): Promise<ShareMember> {
    return await this.createQueryBuilder('csm')
      .innerJoin('collection', 'col', 'col.id = csm.collection_id')
      .andWhere('csm.id =:id', { id })
      .andWhere('csm.user_id =:user_id', { user_id })
      .andWhere('col.is_trashed = :is_trashed', { is_trashed: IS_TRASHED.NOT_TRASHED })
      .andWhere(`csm.shared_status <> :shared_status`,
        { shared_status: SHARE_STATUS.TEMP_REMOVE })
      .getOne();
  }

  async getPermissionMember(colId: number, user_id: number): Promise<boolean> {
    const isPermission = await this.createQueryBuilder('csm')
      .where('csm.collection_id = :collectionId', { collectionId: colId })
      .andWhere('col.is_trashed = :is_trashed', { is_trashed: IS_TRASHED.NOT_TRASHED })
      .andWhere('(csm.user_id = :user_id OR (csm.member_user_id = :member_user_id AND csm.shared_status = :shared_status AND csm.access <> :access))', {
        user_id,
        member_user_id: user_id,
        shared_status: SHARE_STATUS.JOINED,
        access: MEMBER_ACCESS.READ,
      }).leftJoin('collection', 'col', 'col.id = csm.collection_id').getOne();
    return !!isPermission;
  }

  async getShareMembers(collection_id: number | number[], member_user_id: number,
    shared_status: number[]) {
    const query = this.createQueryBuilder('csm')
      .select([
        'u.email email', 'u.id user_id',
        'csm.id id', 'csm.collection_id collection_id', 'csm.user_id user_id',
        'csm.shared_email shared_email',
        'csm.account_id account_id', 'csm.member_user_id member_user_id',
        'csm.calendar_uri calendar_uri', 'csm.access access', 'csm.shared_status shared_status'
      ])
      .innerJoin('user', 'u', 'u.id = csm.user_id');

    if (typeof collection_id === 'number') {
      query.andWhere('csm.collection_id = :collection_id', { collection_id });
    } else if (Array.isArray(collection_id)) {
      query.andWhere('csm.collection_id in (:...collection_id)', { collection_id });
    }
    if (member_user_id) {
      query.andWhere('csm.member_user_id = :member_user_id', { member_user_id });
    }
    if (shared_status) {
      query.andWhere('csm.shared_status in (:...shared_status)', { shared_status });
    }
    return await query.getRawMany();
  }

  async getShareMembersWithCollectionInfo(member_user_id: number, col_ids: number[]) {
    return this.createQueryBuilder('share')
      .select(["share.user_id AS user_id", "share.collection_id AS collection_id", "share.calendar_uri AS calendar_uri", "share.access AS access",
        "share.shared_status AS shared_status", "share.member_user_id AS member_user_id", "share.shared_email AS shared_email", "share.account_id AS account_id",
        'owner.email email'
      ])
      .addSelect('col.calendar_uri', 'owner_calendar_uri')
      .addSelect('owner.username', 'owner_username')
      .innerJoin('collection', 'col', 'col.id = share.collection_id')
      .innerJoin('user', 'owner', 'owner.id = share.user_id')
      .where('share.member_user_id = :member_user_id', { member_user_id })
      .andWhere('share.collection_id IN (:...col_ids)', { col_ids })
      .andWhere(`share.shared_status <> :shared_status`,
        { shared_status: SHARE_STATUS.TEMP_REMOVE })
      .getRawMany();
  }

  async getShareMembersForTrashByObjectId(member_user_id: number
    , object_ids: number[], object_types: string[]) {
    const query = this.createQueryBuilder('share')
      .select(["share.user_id AS user_id", "share.collection_id AS collection_id", "share.access AS access",
        "share.shared_status AS shared_status", "share.member_user_id AS member_user_id", "share.shared_email AS shared_email", "share.account_id AS account_id"])
      .addSelect('url.uid', 'object_uid')
      .addSelect('url.id', 'object_id')
      .addSelect('link.object_type', 'object_type')
      .addSelect('owner.email', 'email')
      .innerJoin('linked_collection_object', 'link', 'link.collection_id = share.collection_id')
      .innerJoin('url', 'url', 'url.uid = link.object_uid')
      .innerJoin('user', 'owner', 'owner.id = share.user_id')
      .where('share.member_user_id = :member_user_id', { member_user_id })
      .andWhere('link.object_type IN (:...object_types)', { object_types })
      .andWhere('url.id IN (:...object_ids)', { object_ids })
      .andWhere(`share.shared_status <> :shared_status`,
        { shared_status: SHARE_STATUS.TEMP_REMOVE });
    return query.getRawMany();
  }

  async getShareMembersForTrash(member_user_id: number
    , object_uids: string[], object_types: string[]) {
    const query = this.createQueryBuilder('share')
      .select(["share.user_id AS user_id", "share.collection_id AS collection_id", "share.access AS access",
        "share.shared_status AS shared_status", "share.member_user_id AS member_user_id", "share.shared_email AS shared_email", "share.account_id AS account_id"])
      .addSelect('link.object_uid', 'object_uid')
      .addSelect('link.object_type', 'object_type')
      .addSelect('owner.email', 'email')
      .innerJoin('linked_collection_object', 'link', 'link.collection_id = share.collection_id')
      .innerJoin('user', 'owner', 'owner.id = share.user_id')
      .where('share.member_user_id = :member_user_id', { member_user_id })
      .andWhere('link.object_type IN (:...object_types)', { object_types })
      .andWhere('link.object_uid IN (:...object_uids)', { object_uids })
      .andWhere(`share.shared_status <> :shared_status`,
        { shared_status: SHARE_STATUS.TEMP_REMOVE });
    return query.getRawMany();
  }

}