import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CommentMentionDto } from "../../modules/collection-comment/dtos/comment.mention.dto";
import { FUNC_MENTION, FUNC_REMOVE_MENTION, PROC_GET_MENTION_USERS } from "../constants/mysql.func";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { GetByCollectionIdDTO } from "../dtos/base-get.dto";
import { Users } from "../entities";
import { CommentMention } from "../entities/comment-mention.entity";
import { IUser } from "../interfaces";
import { getPlaceholderByN } from "../utils/common";
type GetByCollectionID = {
  filter: GetByCollectionIdDTO,
  user: IUser
};

export type MentionUser = {
  username: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  fullname: string;
};
@Injectable()
@CustomRepository(CommentMention)
export class CommentMentionRepository extends Repository<CommentMention> {

  async removeAllMention(commentId: number, userID: number) {
    try {
      const { callType, spName, spParam } = FUNC_REMOVE_MENTION;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) nReturn`, [
          commentId,
          userID
        ]);
      return (saved && saved[0]) ? saved[0].nReturn : 0;
    } catch (error) {
      return { error };
    }
  }

  async addMention(mention: CommentMentionDto, commentId: number,
    userID: number, lastMember: (0 | 1) = 0) {
    try {
      const { callType, spName, spParam } = FUNC_MENTION;
      const mentionText = mention.mention_text || `@${mention.email.split('@').shift()}`;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) nReturn`, [
          mentionText,
          mention.email,
          commentId,
          userID,
          lastMember
        ]);
      return (saved && saved[0]) ? saved[0].nReturn : 0;
    } catch (error) {
      return { error };
    }
  }

  async getAllMentionUsers({ filter, user }: GetByCollectionID): Promise<MentionUser[]> {
    const { collection_id } = filter;
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = PROC_GET_MENTION_USERS;
      const rawMUsers = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          collection_id
          , user.id
          , user.email
        ]);
      //
      const mentionUsers: MentionUser[] = !rawMUsers.length
        ? [] : rawMUsers[0];
      //
      return !mentionUsers.length ? []
        : mentionUsers;
    } finally {
      slaveConnection.release();
    }
  }

  async getMentionUserByComment(commentId: number) {
    const query = this.createQueryBuilder('mt')
    .select([
      'u.email as email'
    ])
    .leftJoin(Users, 'u', `u.id = mt.mention_user_id`)
    .where(`mt.comment_id = :commentId`, { commentId });
    const rs = await query.getRawMany();
    return rs;
  }

}
