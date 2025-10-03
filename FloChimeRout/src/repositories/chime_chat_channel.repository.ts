import { Injectable } from '@nestjs/common';
import { CHIME_CHAT_CHANNEL_TYPE, COLLECTION_TYPE, TRASH_STATUS } from 'common/constants/system.constant';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ChimeChatChannelEntity } from 'entities/chime_chat_channel.entity';
import { ChimeChatChannelMemberEntity } from 'entities/chime_chat_channel_member.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ChimeChatChannelEntity)
export class ChimeChatChannelRepo extends Repository<ChimeChatChannelEntity> {
  async checkUserExistedInChannel(data, userId: number) {
    const isUserExisted = await this.createQueryBuilder('ccc')
      .select(['ccc.id id', 'ccc.channel_arn channel_arn'])
      .innerJoin(ChimeChatChannelMemberEntity, 'cccm', 'cccm.channel_id = ccc.id')
      .where("ccc.internal_channel_id = :internal_channel_id", { internal_channel_id: data.internal_channel_id })
      .andWhere("ccc.internal_channel_type = :internal_channel_type", { internal_channel_type: data.internal_channel_type })
      .andWhere("cccm.member_id = :user_id", { user_id: userId })
      .getRawOne();
    return isUserExisted;
  }

  /**
   * get conference-channel without chim-chat-channel
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getEmptyChannelArn(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT cc.id, cc.user_id, u.email
    FROM conference_channel cc
    INNER JOIN user u ON u.id=cc.user_id ${whereEmail}
    LEFT JOIN chime_chat_channel ccc ON ccc.internal_channel_id=cc.id
        AND ccc.internal_channel_type=${CHIME_CHAT_CHANNEL_TYPE.conferencing}
    WHERE ccc.channel_arn IS NULL OR ccc.channel_arn = ''
    ORDER BY cc.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

  /**
   * get conference-channel without chim-chat-channel
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getMissMemberArn(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND cm.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT ccc.internal_channel_id conf_id, ccc.id chat_channel_id, ccc.channel_arn channel_arn
    , cm.user_id conf_mem_uId, cm.email conf_mem_email, cccm.id
    FROM chime_chat_channel ccc
        INNER JOIN conference_member cm ON cm.channel_id = ccc.internal_channel_id ${whereEmail}
        LEFT JOIN chime_chat_channel_member cccm ON cccm.channel_id = ccc.id
        WHERE ccc.internal_channel_type =${CHIME_CHAT_CHANNEL_TYPE.conferencing} AND (cccm.id IS NULL AND cm.id IS NOT NULL)
        ORDER BY ccc.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

  /**
   * get ChannelWithoutConference
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getChannelWithoutConference(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT ccc.id FROM chime_chat_channel ccc 
      INNER JOIN user u ON u.id=ccc.user_id ${whereEmail}
      LEFT JOIN conference_channel cc ON ccc.internal_channel_id = cc.id
      WHERE ccc.internal_channel_type =1 AND cc.created_date IS NULL
        ORDER BY ccc.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

  /**
   * get getChannelWithoutCol
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getChannelWithoutCol(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT ccc.id FROM chime_chat_channel ccc 
      INNER JOIN user u ON u.id=ccc.user_id ${whereEmail}
      LEFT JOIN collection cc ON ccc.internal_channel_id = cc.id
      WHERE ccc.internal_channel_type =0 AND (cc.created_date IS NULL OR cc.is_trashed = 2)
        ORDER BY ccc.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

  /**
   * get ChannelWithoutConference
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getConfWithoutOwner(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT cc.id  FROM conference_channel cc 
      INNER JOIN user u ON u.id=cc.user_id ${whereEmail}
      LEFT join conference_member cm ON cm.channel_id = cc.id AND cm.is_creator =1
      WHERE cm.id is NULL
        ORDER BY cc.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

  /**
   * get ChannelWithoutConference
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getAllConf(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    if (whereEmail.length > 0) {
      return this.manager.query(`SELECT cc.id, cc.user_id, u.email  
        FROM conference_channel cc 
        INNER JOIN user u ON u.id=cc.user_id ${whereEmail}
        ORDER BY cc.id ASC
      LIMIT ?, ?`, [ofset, limit]);
    } else {
      return this.manager.query(`SELECT cc.id, cc.user_id, u.email  
        FROM conference_channel cc 
        LEFT JOIN user u ON u.id=cc.user_id
        ORDER BY cc.id ASC
      LIMIT ?, ?`, [ofset, limit]);
    }
  }

  /**
   * 
   * @returns 
   */
  async findChatMember(channelId: number): Promise<any[]> {
    return this.manager.query(`SELECT cccm.id
    , ccm.internal_user_id as user_id, ccm.internal_user_email as email
    FROM chime_chat_channel_member cccm 
    INNER JOIN chime_chat_member ccm ON ccm.id = cccm.member_id 
    WHERE cccm.channel_id = ?`, [channelId]);
  }

  /**
   * get shared collection without chim-chat-channel
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getShareColWithoutChannel(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT c.*, u.email
    FROM collection c
    INNER JOIN user u ON c.user_id=u.id AND c.type=${COLLECTION_TYPE.share} ${whereEmail}
    LEFT JOIN chime_chat_channel ccc ON ccc.internal_channel_id=c.id
        AND ccc.internal_channel_type=${CHIME_CHAT_CHANNEL_TYPE.shared_collection}
    WHERE c.type=${COLLECTION_TYPE.share} AND (ccc.channel_arn IS NULL OR ccc.channel_arn = '')
    ORDER BY c.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

  /**
   * get shared collection
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getShareCol(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND u.email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT c.id, c.user_id, u.email
    FROM collection c
    INNER JOIN user u ON c.user_id=u.id AND c.type=${COLLECTION_TYPE.share} ${whereEmail}
    WHERE c.type=${COLLECTION_TYPE.share} AND c.is_trashed <> ${TRASH_STATUS.DELETED}
    ORDER BY c.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }
  /**
   * get all chim-chat-channel
   * @param ofset
   * @param limit 
   * @returns 
   */
  async getAllChannels(ofset: number, limit: number, emails: string): Promise<any[]> {
    let whereEmail = '';
    if (emails?.length > 0 && emails.toLowerCase() !== 'all') {
      const ms = emails.split(',');
      for (let m of ms) {
        whereEmail += `'${m}',`;
      }
      whereEmail = ` AND ccm.internal_user_email IN (${whereEmail}'')`;
    }
    return this.manager.query(`SELECT ccc.id, ccc.channel_arn
      , ccm.internal_user_email, ccm.app_instance_user_arn
    FROM chime_chat_channel ccc
    INNER JOIN chime_chat_member ccm ON ccm.internal_user_id = ccc.user_id ${whereEmail}
    ORDER BY ccc.id ASC
    LIMIT ?, ?`, [ofset, limit]);
  }

}
