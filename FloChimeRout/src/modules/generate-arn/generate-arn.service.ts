import { Injectable } from '@nestjs/common';
import { Chime, ChimeSDKMessaging, STS } from 'aws-sdk';
import { ListChannelMessagesRequest } from 'aws-sdk/clients/chimesdkmessaging';
import { CHIME_CHAT_CHANNEL_TYPE, COLLECTION_MEMBER_ACCESS, COLLECTION_SHARE_STATUS } from 'common/constants/system.constant';
import { LoggerService } from 'common/logger/logger.service';
import { getUpdateTimeByIndex, getUtcMillisecond } from 'common/utils/datetime.util';
import { ChimeChatMemberEntity } from 'entities/chime_chat_member.entity';
import { ChimeChatChannelRepo } from 'repositories/chime_chat_channel.repository';
import { ChimeChatChannelMemberRepo } from 'repositories/chime_chat_channel_member.repository';
import { ChimeChatMemberRepo } from 'repositories/chime_chat_member.repository';
import { ChimeChatMessagesRepo } from 'repositories/chime_chat_messages.repository';
import { ShareMemberRepo } from 'repositories/collection-shared-member.repository';
import { ConferenceMemberRepo } from 'repositories/conference_member.repository';
import { v4 as uuidv4 } from 'uuid';
import chimeConfig from '../../configs/chime.config';
class ConfChannel {
  id: number;
  user_id: number;
  email: string;
};
class ShareCollection {
  id: number;
  user_id: number;
  email: string;
};

@Injectable()
export class GenerateArnService {
  private appInstanceArn: string;
  private userInstanceArn: string;
  private chime: Chime;
  private mainSDKMessaging: ChimeSDKMessaging;
  private readonly sts: STS;
  constructor(
    private readonly chimeChannelRepo: ChimeChatChannelRepo,
    private readonly chimeMemberRepo: ChimeChatMemberRepo,
    private readonly chimeChannelMemberRepo: ChimeChatChannelMemberRepo,
    private readonly confernceMemberRepo: ConferenceMemberRepo,
    private readonly sharedMemberRepo: ShareMemberRepo,
    private readonly chimeMessagesRepo: ChimeChatMessagesRepo,
    private readonly log: LoggerService,
  ) {
    try {
      this.appInstanceArn = chimeConfig().appInstanceArn;
      this.userInstanceArn = chimeConfig().userInstanceArn;
      this.chime = new Chime({
        region: chimeConfig().region,
        accessKeyId: chimeConfig().accessKeyId,
        secretAccessKey: chimeConfig().secretKey,
      });
      this.mainSDKMessaging = new ChimeSDKMessaging({
        region: chimeConfig().region,
        accessKeyId: chimeConfig().accessKeyId,
        secretAccessKey: chimeConfig().secretKey,
        endpoint: chimeConfig().messengingEndpoint,
      });
      this.sts = new STS({
        region: chimeConfig().region,
        credentials: {
          accessKeyId: chimeConfig().accessKeyId,
          secretAccessKey: chimeConfig().secretKey,
        }
      });
    } catch (error) {
      this.log.logError('GenerateArnService:' + JSON.stringify(error));
    }
  }

  private async createMessagingSTS() {
    const sessionName = uuidv4();
    const assumeRoleParams = {
      RoleArn: chimeConfig().role_arn,
      RoleSessionName: sessionName,
      DurationSeconds: 900
    };
    const stsData = await this.sts.assumeRole(assumeRoleParams).promise();
    const credentials = stsData.Credentials;
    const credentialConfig = {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
      region: chimeConfig().region,
      endpoint: chimeConfig().messengingEndpoint,
    };
    const chimeMessagingClient = new ChimeSDKMessaging(credentialConfig);
    return chimeMessagingClient;
  }

  private async getOrCreateChimeMember(user: {userId: number, email: string}
    , dateItem: number): Promise<ChimeChatMemberEntity> {
    try {
      const memberExisted = await this.chimeMemberRepo.findOne({
        where: {
          internal_user_id: user.userId
        }
      });
      if (memberExisted) {
        return memberExisted;
      } else {
        const memberEmail = user.email;
        const nameMember = memberEmail.slice(0, memberEmail.indexOf('@'));
        const ClientRequestToken = uuidv4();
        const memberInfo = await this.chime.createAppInstanceUser({
          AppInstanceArn: this.appInstanceArn,
          AppInstanceUserId: memberEmail,
          Name: nameMember,
          ClientRequestToken
        }).promise();
        // save infor member into db
        const memberEntity = this.chimeMemberRepo.create({
          internal_user_email: user.email,
          internal_user_id: user.userId,
          app_instance_user_arn: memberInfo.AppInstanceUserArn,
          created_date: dateItem,
          updated_date: dateItem
        });
        const createMember = await this.chimeMemberRepo.save(memberEntity);
        return createMember;
      }
    } catch (error) {
      this.log.logError('getOrCreateChimeMember:' + JSON.stringify(error));
    }
  }

  private async createChatChannel (
    confChannel: ConfChannel, chimeMessagingClient: ChimeSDKMessaging, dateItem: number, result) {
    // 4. find or create chime-chat-member
    if (!confChannel?.email) {
      const m = await this.confernceMemberRepo.findOne({where: {
        channel_id: confChannel.id
      }});
      confChannel.email = m?.email;
    }
    const creator = await this.getOrCreateChimeMember({
      userId: confChannel.user_id,
      email: confChannel.email
    }, dateItem);
    if (creator == null) {
      result.skip += 1;
      return;
    }
    // create chatting channel
    const params = {
      Name: `title_${dateItem}`,
      AppInstanceArn: this.appInstanceArn,
      Privacy: 'PUBLIC',
      ClientRequestToken: uuidv4(),
      ChimeBearer: creator.app_instance_user_arn,
    };
    // 5. create channel on Chime Service
    try {
      const response = await chimeMessagingClient.createChannel(params).promise();
      if (response?.ChannelArn) {
        result.success += 1;
        // 6. insert chim-chat-channel on Flo DB 
        const channelEntity = this.chimeChannelRepo.create({
          internal_channel_id: confChannel.id,
          internal_channel_type: CHIME_CHAT_CHANNEL_TYPE.conferencing,
          channel_arn: response.ChannelArn,
          user_id: confChannel.user_id,
          created_date: dateItem,
          updated_date: dateItem
        });
        const channelItem = await this.chimeChannelRepo.save(channelEntity);

        // 7. get conference members (include creator/owner)
        const conferenceMembers = await this.confernceMemberRepo.find({
          where: { channel_id: confChannel.id }
        });
        // 8. Loop in conference member list
        for (const conferenceMember of conferenceMembers) {
          // 9. find or create chime-chat-member
          const memberItem = await this.getOrCreateChimeMember({
            userId: conferenceMember.user_id,
            email: conferenceMember.email
          }, dateItem);
          if (memberItem == null) {
            result.skipMember += 1;
            continue;
          }
          try {
            const params = {
              ChannelArn: response.ChannelArn,
              MemberArn: memberItem.app_instance_user_arn,
              ChimeBearer: memberItem.app_instance_user_arn,
              Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
            };
            // 10. add member into Chime service
            await chimeMessagingClient.createChannelMembership(params).promise();
          } catch (error) {
            this.log.logError('Member is exist on chime:' + JSON.stringify(error));
          }

          // 11. save into db chime member channel
          const channelMemberEntity = this.chimeChannelMemberRepo.create({
            channel_id: channelItem.id,
            member_id: memberItem.id,
            created_date: dateItem,
            updated_date: dateItem
          });
          await this.chimeChannelMemberRepo.save(channelMemberEntity);
        }
      }
    } catch (error) {
      result.skipMember += 1;
      this.log.logError('generateArn-createChannel:' + JSON.stringify(error));
    }
  }

  async createChatChannel4ShareCol(
    col: ShareCollection, chimeMessagingClient: ChimeSDKMessaging, dateItem: number, result) {
    // 3. find or create chime-chat-member
    const creator = await this.getOrCreateChimeMember({
      userId: col.user_id,
      email: col.email
    }, dateItem);
    if (creator == null) {
      result.skip += 1;
      return;
    }
    // create chatting channel
    const params = {
      Name: `title_${dateItem}`,
      AppInstanceArn: this.appInstanceArn,
      Privacy: 'PUBLIC',
      ClientRequestToken: uuidv4(),
      ChimeBearer: creator.app_instance_user_arn,
    };
    // 4. create channel on Chime Service
    try {
    const response = await chimeMessagingClient.createChannel(params).promise();
    if (response?.ChannelArn) {
      result.success += 1;
      // 5. insert chim-chat-channel on Flo DB 
      const channelEntity = this.chimeChannelRepo.create({
        internal_channel_id: col.id,
        internal_channel_type: CHIME_CHAT_CHANNEL_TYPE.shared_collection,
        channel_arn: response.ChannelArn,
        user_id: col.user_id,
        created_date: dateItem,
        updated_date: dateItem
      });
      const channelItem = await this.chimeChannelRepo.save(channelEntity);
      // 7. create chime member channel for owner
      const channelMemberEntity = this.chimeChannelMemberRepo.create({
        channel_id: channelItem.id,
        member_id: creator.id,
        created_date: dateItem,
        updated_date: dateItem
      });
      await this.chimeChannelMemberRepo.save(channelMemberEntity);

      // 7. get members of the shared collection
      const shareMembers = await this.sharedMemberRepo.find({
        where: [{
          collection_id: col.id,
          shared_status: COLLECTION_SHARE_STATUS.JOINED,
          access: COLLECTION_MEMBER_ACCESS.READ_WRITE
        }, {
          collection_id: col.id,
          shared_status: COLLECTION_SHARE_STATUS.JOINED,
          access: COLLECTION_MEMBER_ACCESS.OWNER
        }
      ]
      });
      // 8. Loop in conference member list
      for (const shareMember of shareMembers) {
        // 9. find or create chime-chat-member
        const memberItem = await this.getOrCreateChimeMember({
          userId: shareMember.member_user_id,
          email: shareMember.shared_email
        }, dateItem);
        if (memberItem == null) {
          result.skipMember += 1;
          continue;
        }
        const params = {
          ChannelArn: response.ChannelArn,
          MemberArn: memberItem.app_instance_user_arn,
          ChimeBearer: memberItem.app_instance_user_arn,
          Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
        };
        // 10. add member into Chime service
        await chimeMessagingClient.createChannelMembership(params).promise();

        // 11. save into db chime member channel
        const channelMemberEntity = this.chimeChannelMemberRepo.create({
          channel_id: channelItem.id,
          member_id: memberItem.id,
          created_date: dateItem,
          updated_date: dateItem
        });
        await this.chimeChannelMemberRepo.save(channelMemberEntity);
      }
    }          
    } catch (error) {
      this.log.logError('generateArn-createChatChannel4ShareCol:' + JSON.stringify(error));
    }
  }

  async generateArn(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    try {
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const limit = 50;
      // 1. get conference_channel without chime_chat_channel
      const confChannels: ConfChannel[] = await this.chimeChannelRepo.getEmptyChannelArn(offset, limit, emails);
      const currentTime = getUtcMillisecond();
      let idx = 0;
      result.total = confChannels.length;
      // 2. loop in conference channel list
      for (const confChannel of confChannels) {
        // 3. get email of owner channel
        
        const dateItem = getUpdateTimeByIndex(currentTime, idx++);
        await this.createChatChannel(confChannel, chimeMessagingClient, dateItem, result);
        await delay(100);
      }
      if (confChannels.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(1000);
        const resPart = await this.generateArn(offset, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('generateArn:' + JSON.stringify(e));
      return result;
    }
  }

  async generateMissMemberArn(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    class MissMember {
      conf_id: number;
      chat_channel_id: number;
      channel_arn: string;
      conf_mem_email: string;
      conf_mem_uId: number;
      chat_channel_member_id: number;
    };
    try {
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const limit = 50;
      // 1. conference miss member
      const missMembers: MissMember[] = await this.chimeChannelRepo.getMissMemberArn(offset, limit, emails);
      const currentTime = getUtcMillisecond();
      let idx = 0;
      result.total = missMembers.length;
      // 2. loop in conference channel list
      for (const missMember of missMembers) {
        if (!missMember.chat_channel_member_id) {
          const dateItem = getUpdateTimeByIndex(currentTime, idx++);
          // 3. find or create chime-chat-member
          const member = await this.getOrCreateChimeMember({
            userId: missMember.conf_mem_uId,
            email: missMember.conf_mem_email
          }, dateItem);
          if (member == null) {
            result.skipMember += 1;
            continue;
          }
          try {
            const params = {
              ChannelArn: missMember.channel_arn,
              MemberArn: member.app_instance_user_arn,
              ChimeBearer: member.app_instance_user_arn,
              Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
            };
            // 4. add member into Chime service
            await chimeMessagingClient.createChannelMembership(params).promise();
          } catch (error) {
            this.log.logError('Member is exist on chime:' + JSON.stringify(error));
          }

          // 5. save into db chime member channel
          const channelMemberEntity = this.chimeChannelMemberRepo.create({
            channel_id: missMember.chat_channel_id,
            member_id: member.id,
            created_date: dateItem,
            updated_date: dateItem
          });
          await this.chimeChannelMemberRepo.save(channelMemberEntity);
          result.success += 1;
        }
        await delay(100);
      }
      if (missMembers.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(1000);
        const resPart = await this.generateMissMemberArn(offset, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('generateMissMemberArn:' + JSON.stringify(e));
      return result;
    }
  }

  async deleteChannelWithoutCol(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    class Channel {
      id: number;
    };
    try {
      const limit = 300;
      // 1. conference miss member
      const channelWithoutCol: Channel[] = await this.chimeChannelRepo.getChannelWithoutCol(offset, limit, emails);
      result.total = channelWithoutCol.length;
      // 2. loop in channel list
      for (const missMember of channelWithoutCol) {
        if (missMember.id) {
          await this.chimeChannelMemberRepo.delete({
            channel_id: missMember.id
          });
          await this.chimeChannelRepo.delete({
            id: missMember.id
          });
          result.success += 1;
        }
        await delay(10);
      }
      if (channelWithoutCol.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(100);
        const resPart = await this.deleteChannelWithoutCol(offset, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('deleteChannelWithoutCol:' + JSON.stringify(e));
      return result;
    }
  }

  async deleteChannelWithoutConference(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    class Channel {
      id: number;
    };
    try {
      const limit = 300;
      // 1. conference miss member
      const channelWithoutConference: Channel[] = await this.chimeChannelRepo.getChannelWithoutConference(offset, limit, emails);
      const currentTime = getUtcMillisecond();
      result.total = channelWithoutConference.length;
      // 2. loop in channel list
      for (const missMember of channelWithoutConference) {
        if (missMember.id) {
          await this.chimeChannelMemberRepo.delete({
            channel_id: missMember.id
          });
          await this.chimeChannelRepo.delete({
            id: missMember.id
          });
          result.success += 1;
        }
        await delay(10);
      }
      if (channelWithoutConference.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(100);
        const resPart = await this.deleteChannelWithoutConference(offset, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('deleteChannelWithoutConference:' + JSON.stringify(e));
      return result;
    }
  }

  async fixChannelWrongMembers(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    class Conference {
      id: number;
    };
    try {
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const limit = 50;
      // 1. conference miss member
      const confErrors: Conference[] = await this.chimeChannelRepo.getConfWithoutOwner(offset, limit, emails);
      let idx = 0;
      result.total = confErrors.length;
      const currentTime = getUtcMillisecond();
      // 2. loop in channel list
      for (const confError of confErrors) {
        if (confError?.id) {
          const chatChannel = await this.chimeChannelRepo.findOne({
            where: {
              internal_channel_id: confError.id,
              internal_channel_type: CHIME_CHAT_CHANNEL_TYPE.conferencing
            }
          });
          if (chatChannel?.id) {
            await this.chimeChannelMemberRepo.delete({
              channel_id: chatChannel.id
            });
            const dateItem = getUpdateTimeByIndex(currentTime, idx++);
            const conferenceMembers = await this.confernceMemberRepo.find({
              where: { channel_id: confError.id }
            });
            // 8. Loop in conference member list
            for (const conferenceMember of conferenceMembers) {
              // 9. find or create chime-chat-member
              const memberItem = await this.getOrCreateChimeMember({
                userId: conferenceMember.user_id,
                email: conferenceMember.email
              }, dateItem);
              if (memberItem == null) {
                result.skipMember += 1;
                continue;
              }
              try {
                const params = {
                  ChannelArn: chatChannel.channel_arn,
                  MemberArn: memberItem.app_instance_user_arn,
                  ChimeBearer: memberItem.app_instance_user_arn,
                  Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
                };
                // 10. add member into Chime service
                await chimeMessagingClient.createChannelMembership(params).promise();                  
              } catch (error) {
                this.log.logError('Member is exist on chime:' + JSON.stringify(error));
              }
              // 11. save into db chime member channel
              const channelMemberEntity = this.chimeChannelMemberRepo.create({
                channel_id: chatChannel.id,
                member_id: memberItem.id,
                created_date: dateItem,
                updated_date: dateItem
              });
              await this.chimeChannelMemberRepo.save(channelMemberEntity);
            }
          }
          result.success += 1;
        }
        await delay(10);
      }
      if (confErrors.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(100);
        const resPart = await this.fixChannelWrongMembers(offset + limit, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('fixChannelWrongMembers:' + JSON.stringify(e));
      return result;
    }
  }

  async fixAllChannels(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    try {
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const limit = 300;
      // 1. get all conference
      let confs: ConfChannel[] = await this.chimeChannelRepo.getAllConf(offset, limit, emails);
      let idx = 0;
      result.total = confs.length;
      const currentTime = getUtcMillisecond();
      // 2. loop in channel list
      for (let conf of confs) {
        const dateItem = getUpdateTimeByIndex(currentTime, idx++);
        const chatChannel = await this.chimeChannelRepo.findOne({
          where: {
            internal_channel_id: conf.id,
            internal_channel_type: CHIME_CHAT_CHANNEL_TYPE.conferencing
          }
        });
        if (chatChannel?.id) {
          const chatMembers: ConfChannel[] = await this.chimeChannelRepo
          .findChatMember(chatChannel.id);
          const conferenceMembers = await this.confernceMemberRepo.find({
            where: { channel_id: conf.id }
          });
          // 8. Loop in conference member list
          for (const conferenceMember of conferenceMembers) {
            const hasMember = chatMembers.find(member => member.user_id === conferenceMember.user_id);
            if (!hasMember){
              // 9. find or create chime-chat-member
              const memberItem = await this.getOrCreateChimeMember({
                userId: conferenceMember.user_id,
                email: conferenceMember.email
              }, dateItem);
              if (memberItem == null) {
                result.skipMember += 1;
                continue;
              }
              try {
                const params = {
                  ChannelArn: chatChannel.channel_arn,
                  MemberArn: memberItem.app_instance_user_arn,
                  ChimeBearer: memberItem.app_instance_user_arn,
                  Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
                };
                // 10. add member into Chime service
                await chimeMessagingClient.createChannelMembership(params).promise();                  
              } catch (error) {
                this.log.logError('Member is exist on chime:' + JSON.stringify(error));
              }
              // 11. save into db chime member channel
              const channelMemberEntity = this.chimeChannelMemberRepo.create({
                channel_id: chatChannel.id,
                member_id: memberItem.id,
                created_date: dateItem,
                updated_date: dateItem
              });
              await this.chimeChannelMemberRepo.save(channelMemberEntity);
              await delay(100);
            }
          }
          for (const chatMember of chatMembers) {
            const hasMember = conferenceMembers.find(member => member.user_id === chatMember.user_id);
            if (!hasMember) {
              await this.chimeChannelMemberRepo.delete({id: chatMember.id});
            }
          }
          result.success += 1;
        } else {
          await this.createChatChannel(conf, chimeMessagingClient, dateItem, result);
          await delay(100);
        }
      }
      if (confs.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(100);
        const resPart = await this.fixAllChannels(offset + limit, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('fixAllChannels:' + JSON.stringify(e));
      return result;
    }
  }

  async migrateConf4ShareColl(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    try {
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const limit = 500;
      // 1. get shared collection
      const sharedCols: ShareCollection[] = await this.chimeChannelRepo
      .getShareCol(offset, limit, emails);
      const currentTime = getUtcMillisecond();
      let idx = 0;
      result.total = sharedCols.length;
      // 2. loop in shared collection list
      for (const col of sharedCols) {
        const dateItem = getUpdateTimeByIndex(currentTime, idx++);
        const chatChannel = await this.chimeChannelRepo.findOne({
          where: {
            internal_channel_id: col.id,
            internal_channel_type: CHIME_CHAT_CHANNEL_TYPE.shared_collection
          }
        });
        if (chatChannel?.id) {
          const chatMembers: ConfChannel[] = await this.chimeChannelRepo
          .findChatMember(chatChannel.id);
          const shareMembers = await this.sharedMemberRepo.find({
            where: [{
              collection_id: col.id,
              shared_status: COLLECTION_SHARE_STATUS.JOINED,
              access: COLLECTION_MEMBER_ACCESS.READ_WRITE
            },{
              collection_id: col.id,
              shared_status: COLLECTION_SHARE_STATUS.JOINED,
              access: COLLECTION_MEMBER_ACCESS.OWNER
            }
          ]
          });
          // add owner
          shareMembers.push(this.sharedMemberRepo.create({
            member_user_id: col.user_id,
            shared_email: col.email
          }));
          // 8. Loop in conference member list
          for (const shareMember of shareMembers) {
            const hasMember = chatMembers.find(member => member.user_id === shareMember.member_user_id);
            if (!hasMember){
              // 9. find or create chime-chat-member
              const memberItem = await this.getOrCreateChimeMember({
                userId: shareMember.member_user_id,
                email: shareMember.shared_email
              }, dateItem);
              if (memberItem == null) {
                result.skipMember += 1;
                continue;
              }
              const params = {
                ChannelArn: chatChannel.channel_arn,
                MemberArn: memberItem.app_instance_user_arn,
                ChimeBearer: memberItem.app_instance_user_arn,
                Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
              };
              // 10. add member into Chime service
              await chimeMessagingClient.createChannelMembership(params).promise();

              // 11. save into db chime member channel
              const channelMemberEntity = this.chimeChannelMemberRepo.create({
                channel_id: chatChannel.id,
                member_id: memberItem.id,
                created_date: dateItem,
                updated_date: dateItem
              });
              await this.chimeChannelMemberRepo.save(channelMemberEntity);
              await delay(100);
            }
          }
          for (const chatMember of chatMembers) {
            const hasMember = shareMembers.find(member => member.member_user_id === chatMember.user_id);
            if (!hasMember) {
              await this.chimeChannelMemberRepo.delete({id: chatMember.id});
            }
          }
          result.success += 1;
        } else {
          await this.createChatChannel4ShareCol(col, chimeMessagingClient, dateItem, result);
          await delay(100);
        }
      }
      if (sharedCols.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(1000);
        const resPart = await this
        .migrateConf4ShareColl(offset + limit, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('generateConference4ShareCollection:' + JSON.stringify(e));
      return result;
    }
  }

  async migrateMessages(offset: number, emails: string, limitOnePart: boolean) {
    const result = {
      total: 0,
      success: 0,
      skip: 0,
      skipMember: 0
    };
    class Channel {
      id: number;
      channel_arn: string;
      internal_user_email: string;
      app_instance_user_arn: string;
    };
    try {
      const limit = 500;
      // 1. get all channels
      const channels: Channel[] = await this.chimeChannelRepo.getAllChannels(offset, limit, emails);
      const currentTime = getUtcMillisecond();
      result.total = channels.length;
      const MaxResults = 50; // Member must have value less than or equal to 50
      // 2. loop in channel list
      for (const channel of channels) {
        if (channel.id) {
          const max = await this.chimeMessagesRepo.getMaxMigrate(channel.id);
          const params: ListChannelMessagesRequest = {
            ChannelArn: channel.channel_arn,
            ChimeBearer: channel.app_instance_user_arn,
            MaxResults: MaxResults,
            // NextToken: dtoChannel.next_token,
            SortOrder: 'ASCENDING' // ASC base on time create
          };
          if (max?.max_time > 0) {
            params.NotBefore = new Date(max.max_time * 1000);
          }
          // if (dtoChannel?.not_after > 1) {
          //   params.NotAfter = new Date(dtoChannel?.not_after * 1000)
          // }
          // if (dtoChannel?.sort_order) {
          //   params.SortOrder = (dtoChannel.sort_order === SORT_TYPE.ASC) ? 'ASCENDING' : 'DESCENDING';
          // }
          let allResult = false;
          let NotBefore = 0;
          do {
            const listMessage = await this.mainSDKMessaging.listChannelMessages(params).promise();
            const messages = listMessage.ChannelMessages;
            for (const message of messages) {
              const ownerMessage = await this.chimeMemberRepo.findOne({
                where: {
                  app_instance_user_arn: message.Sender.Arn
                }
              });
              const existMessage = await this.chimeMessagesRepo.findOne({
                where: {
                  user_id: ownerMessage.internal_user_id,
                  internal_message_uid: message.MessageId
                }
              });
              if(!existMessage?.id) {
                await this.chimeMessagesRepo.insert({
                  internal_message_uid: message.MessageId,
                  is_deleted: 0,
                  created_date: message.CreatedTimestamp.getTime()/1000,
                  updated_date: currentTime,
                  user_id: ownerMessage.internal_user_id,
                  migrate_time: message.CreatedTimestamp.getTime()/1000,
                });
              } else if (existMessage?.id && !existMessage.channel_id) {
                // fix miss channel id
                await this.chimeMessagesRepo.update({
                  id: existMessage.id
                }, {
                  channel_id: channel.id,
                  migrate_time: message.CreatedTimestamp.getTime()/1000,
                });
              }
              if (NotBefore < message.CreatedTimestamp.getTime()){
                NotBefore = message.CreatedTimestamp.getTime();
              }
            }
            if (messages?.length >= MaxResults) {
              params.NotBefore = new Date(NotBefore);
              allResult = false;
            } else {
              allResult = true;
            }
          } while (!allResult);
          result.success += 1;
        }
        await delay(10);
      }
      if (channels.length >= limit && result.success > 0 && !limitOnePart) {
        await delay(100);
        const resPart = await this.migrateMessages(offset, emails, limitOnePart);
        result.skip = result.skip + resPart.skip;
        result.skipMember = result.skipMember + resPart.skipMember;
        result.success = result.success + resPart.success;
        result.total = result.total + resPart.total;
      }
      return result;
    } catch (e) {
      this.log.logError('migrateMessages:' + JSON.stringify(e));
      return result;
    }
  }

  async processExit() {
    await delay(5000);
    process.exit(0);
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));