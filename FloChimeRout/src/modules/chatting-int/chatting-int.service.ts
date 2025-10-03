import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Chime, ChimeSDKMessaging, STS } from 'aws-sdk';
import { DeleteChannelMessageRequest, ListChannelMessagesRequest, SendChannelMessageRequest, UpdateChannelMessageRequest } from 'aws-sdk/clients/chimesdkmessaging';
import { plainToClass } from 'class-transformer';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import { REALTIME_STATUS, SORT_TYPE } from 'common/constants/system.constant';
import { IReq, IReqUser } from 'common/interfaces/auth.interface';
import { buildFailItemResponses } from 'common/utils/chatting.respond';
import { generateWebsocketChatUrl, retryWithExponentialBackoff } from 'common/utils/chime.util';
import { filterItems } from 'common/utils/common.util';
import { getUpdateTimeByIndex, getUtcMillisecond } from 'common/utils/datetime.util';
import appConfig from 'configs/app.config';
import { RealTimeService } from 'modules/communication/services';
import { TaskQueueService } from 'modules/task-queue/task-queue.service';
import { ChimeChatMessagesRepo } from 'repositories/chime_chat_messages.repository';
import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import chimeConfig from '../../configs/chime.config';
import { ChimeChatChannelRepo } from '../../repositories/chime_chat_channel.repository';
import { ChimeChatChannelMemberRepo } from '../../repositories/chime_chat_channel_member.repository';
import { ChimeChatMemberRepo } from '../../repositories/chime_chat_member.repository';
import { GenMemberDTO } from './dtos/chatting-int--gen-member.post.dto';
import { MemberChannelDTO } from './dtos/chatting-int-member.post.dto';
import { ListMessageIntDTO, MessageIntDTO } from './dtos/chatting-int-message.post.dto';
import { EditMessageIntDTO } from './dtos/chatting-int-message.put.dto';
import { DeleteIntDTO, DeleteMessageIntDTO } from './dtos/chatting-int.delete.dto';
import { CreateChannelDTO } from './dtos/chatting-int.post.dto';


@Injectable()
export class ChatingService {
  private appInstanceArn: string;
  private userInstanceArn: string;
  private chime: Chime;
  private mainSDKMessaging: ChimeSDKMessaging;
  private readonly sts: STS;
  constructor(
    private readonly chimeChatChannelRepo: ChimeChatChannelRepo,
    private readonly chimeChatMemberRepo: ChimeChatMemberRepo,
    private readonly chimeChatMessagesRepo: ChimeChatMessagesRepo,
    private readonly chimeChatChannelMemberRepo: ChimeChatChannelMemberRepo,
    private readonly queueService: TaskQueueService,
    private readonly realTimeService: RealTimeService
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

  async getListMessagesChannel(data: ListMessageIntDTO, userId: number) {
    const dtoChannel = plainToClass(ListMessageIntDTO, data);
    try {
      const memberItem = await this.chimeChatMemberRepo.findOne({
        select: ['id', 'app_instance_user_arn'],
        where: {
          internal_user_id: userId
        }
      })
      if (!memberItem) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.MEMBER_NOT_EXIST,
          data,
        );
        return { error: errItem };
      } else {
        // check this user is exited in channel or not
        const channelItem = await this.chimeChatChannelRepo.checkUserExistedInChannel(dtoChannel, memberItem.id);
        if (!channelItem) {
          const errItem = buildFailItemResponses(
            ErrorCode.BAD_REQUEST,
            ErrorMessage.CHANNEL_DOES_NOT_EXIST,
            data,
          );
          return { error: errItem };
        }

        const params: ListChannelMessagesRequest = {
          ChannelArn: channelItem.channel_arn,
          ChimeBearer: memberItem.app_instance_user_arn,
          MaxResults: dtoChannel.max_results || 10,
          NextToken: dtoChannel.next_token
        };
        if (dtoChannel?.not_before > 1) {
          params.NotBefore = new Date(dtoChannel.not_before * 1000);
        }
        if (dtoChannel?.not_after > 1) {
          params.NotAfter = new Date(dtoChannel?.not_after * 1000)
        }
        if (dtoChannel?.sort_order) {
          params.SortOrder = (dtoChannel.sort_order === SORT_TYPE.ASC) ? 'ASCENDING' : 'DESCENDING';
        }
        const request = await this.mainSDKMessaging.listChannelMessages(params).promise();
        if(request?.ChannelMessages) {
          request?.ChannelMessages.map(item => {
            if(item.Metadata) {
              item.Metadata = JSON.parse(item.Metadata);
            }
          })
        }
        return { data: request };
      }
    } catch (error) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        error.message,
        data
      );
      return { error: errItem };
    }
  }

  async createChannels(channels: CreateChannelDTO[], memberItem: any, userid: number) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();

    const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();

    const batchPromises = channels.map(async (item, idx) => {
      try {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        // create chatting channel
        const params = {
          Name: `title_${dateItem}`,
          AppInstanceArn: this.appInstanceArn,
          MemberArns: [memberItem.app_instance_user_arn],
          Privacy: 'PUBLIC',
          ClientRequestToken: uuidv4(),
          ChimeBearer: memberItem.app_instance_user_arn,
        };
        const response = await retryWithExponentialBackoff(async () => {
          return  await chimeMessagingClient.createChannel(params).promise();
        })
        // const response = await chimeMessagingClient.createChannel(params).promise();
        if (response?.ChannelArn) {

          // insert channel 
          const channelEntity = this.chimeChatChannelRepo.create({
            ...item,
            channel_arn: response.ChannelArn,
            user_id: userid,
            created_date: dateItem,
            updated_date: dateItem
          });
          const channelItem = await this.chimeChatChannelRepo.save(channelEntity);

          // save into db chime member channel
          const channelMemberEntity = this.chimeChatChannelMemberRepo.create({
            channel_id: channelItem.id,
            member_id: memberItem.id,
            created_date: dateItem,
            updated_date: dateItem
          });
          await this.chimeChatChannelMemberRepo.save(channelMemberEntity);

          item['status'] = 1;
          itemPass.push(item);
        }
      } catch (error) {
        item['status'] = 0;
        itemFail.push(item);
      }
    });

    await Promise.all(batchPromises);

    return { itemPass, itemFail}
  }

  async createChannel(data: CreateChannelDTO[], user: IReqUser): Promise<any> {
    let itemPass = [];
    let itemFail = [];
    try {
      
      if (data?.length > 0) {
        // Get member arn for owner
        const memberItem = await this.getOwnerArn(user);
        let index = 0;
        const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
        while (index < data.length) {
          const batchChannelData = data.slice(index, index + MAX_BATCH_SIZE);
          const taskId = this.queueService.addTask(
            () => this.createChannels(batchChannelData, memberItem, user.id ), 
            { 
              started: (taskId: string) => {
                // console.log('Started: ', taskId)
              },
              error: (taskId, error) => {
                // console.error("task: " + taskId + "got error: ", error)
              },
              done: (taskId: string, result: any) => {
              // console.log('Task done: ', taskId)
              if (result?.itemFail?.length > 0) {
                itemFail = [... result.itemFail, ...itemFail]
              }

              if (result?.itemPass?.length > 0) {
                itemPass = [... result.itemPass, ...itemPass]
              }
            }});
          await this.queueService.waitForDone(taskId)
          index += MAX_BATCH_SIZE;
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createChannelBK(data: CreateChannelDTO[], user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    try {
      if (data?.length > 0) {
        // Get member arn for owner
        const memberItem = await this.getOwnerArn(user);

        let index = 0;
        const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
        const FUNC = appConfig().chimeDelay;
        const currentTime = getUtcMillisecond();
        while (index < data.length) {
          const batchIds = data.slice(index, index + MAX_BATCH_SIZE);
          const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
          const batchPromises = batchIds.map(async (item, idx) => {
            try {
              const dateItem = getUpdateTimeByIndex(currentTime, idx);
              // create chatting channel
              const params = {
                Name: `title_${dateItem}`,
                AppInstanceArn: this.appInstanceArn,
                MemberArns: [memberItem.app_instance_user_arn],
                Privacy: 'PUBLIC',
                ClientRequestToken: uuidv4(),
                ChimeBearer: memberItem.app_instance_user_arn,
              };
              const response = await chimeMessagingClient.createChannel(params).promise();
              if (response?.ChannelArn) {

                // insert channel 
                const channelEntity = this.chimeChatChannelRepo.create({
                  ...item,
                  channel_arn: response.ChannelArn,
                  user_id: user.userId,
                  created_date: dateItem,
                  updated_date: dateItem
                });
                const channelItem = await this.chimeChatChannelRepo.save(channelEntity);

                // save into db chime member channel
                const channelMemberEntity = this.chimeChatChannelMemberRepo.create({
                  channel_id: channelItem.id,
                  member_id: memberItem.id,
                  created_date: dateItem,
                  updated_date: dateItem
                });
                await this.chimeChatChannelMemberRepo.save(channelMemberEntity);

                item['status'] = 1;
                itemPass.push(item);
              }
            } catch (error) {
              // console.log(error)
              item['status'] = 0;
              itemFail.push(item);
            }
          });

          await Promise.all(batchPromises);
          index += MAX_BATCH_SIZE;

          // Add a delay to comply with rate limits
          await new Promise((resolve) => setTimeout(resolve, FUNC)); // Adjust the delay as needed
        }
        // insert channel valid
        // await this.chimeChatChannelRepo.insert(itemPass);
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private async getOwnerArn(user: IReqUser) {
    const currentTime = getUtcMillisecond();
    try {
      const memberExisted = await this.chimeChatMemberRepo.findOne({
        where: {
          internal_user_id: user.userId
        }
      });
      if (memberExisted) {
        return memberExisted;
      } else {
        const dateItem = getUpdateTimeByIndex(currentTime, 0);
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
        const memberEntity = this.chimeChatMemberRepo.create({
          internal_user_email: user.email,
          internal_user_id: user.userId,
          app_instance_user_arn: memberInfo.AppInstanceUserArn,
          created_date: dateItem,
          updated_date: dateItem
        });
        const memberExisted = await this.chimeChatMemberRepo.save(memberEntity);
        return memberExisted
      }
    } catch (error) {
    }
  }

  private async getMemberArn(lstMembers: MemberChannelDTO[]) {
    const currentTime = getUtcMillisecond();
    const memberValid = [];
    const itemFail = [];
    for (const member of lstMembers) {
      try {
        const memberExisted = await this.chimeChatMemberRepo.findOne({
          where: {
            internal_user_id: member.internal_user_id
          }
        });
        if (memberExisted) {
          memberExisted['internal_channel_id'] = member.internal_channel_id;
          memberExisted['internal_channel_type'] = member.internal_channel_type;
          memberValid.push(memberExisted);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, 0);
          const memberEmail = member.internal_user_email;
          const nameMember = memberEmail.slice(0, memberEmail.indexOf('@'));
          const ClientRequestToken = uuidv4();
          const memberInfo = await this.chime.createAppInstanceUser({
            AppInstanceArn: this.appInstanceArn,
            AppInstanceUserId: memberEmail,
            Name: nameMember,
            ClientRequestToken
          }).promise();
          // save infor member into db
          const memberEntity = this.chimeChatMemberRepo.create({
            ...member,
            app_instance_user_arn: memberInfo.AppInstanceUserArn,
            created_date: dateItem,
            updated_date: dateItem
          });
          const memberExisted = await this.chimeChatMemberRepo.save(memberEntity);
          memberExisted['internal_channel_id'] = member.internal_channel_id;
          memberExisted['internal_channel_type'] = member.internal_channel_type;
          memberValid.push(memberExisted);
        }
      } catch (error) {
        member['status'] = 0;
        itemFail.push(member)
      }
    }
    return { memberValid, itemFail };
  }

  async generateMembers(lstMembers: GenMemberDTO[]) {
    const currentTime = getUtcMillisecond();
    const itemPass = [];
    const itemFail = [];
    await Promise.all(lstMembers.map(async (member: GenMemberDTO, idx) => {
      try {
        const memberExisted = await this.chimeChatMemberRepo.findOne({
          where: {
            internal_user_id: member.internal_user_id
          }
        });
        if (memberExisted) {
          member['status'] = 1;
          itemPass.push(memberExisted);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, 0);
          const memberEmail = member.internal_user_email;
          const nameMember = memberEmail.slice(0, memberEmail.indexOf('@'));
          const ClientRequestToken = uuidv4();
          const memberInfo = await this.chime.createAppInstanceUser({
            AppInstanceArn: this.appInstanceArn,
            AppInstanceUserId: memberEmail,
            Name: nameMember,
            ClientRequestToken
          }).promise();
          // save infor member into db
          const memberEntity = this.chimeChatMemberRepo.create({
            ...member,
            app_instance_user_arn: memberInfo.AppInstanceUserArn,
            created_date: dateItem,
            updated_date: dateItem
          });
          await this.chimeChatMemberRepo.save(memberEntity);
          member['status'] = 1;
          itemPass.push(member);
        }
      } catch (error) {
        member['status'] = 0;
        itemFail.push(member)
      }
    }));
    return { itemPass, itemFail };
  }

  async createMembers(data: MemberChannelDTO[], user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    try {
      if (data?.length > 0) {
        // get member arn first
        const { memberValid, itemFail } = await this.getMemberArn(data);
        if (memberValid?.length > 0) {
          let index = 0;
          const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
          const FUNC = appConfig().chimeDelay;
          const currentTime = getUtcMillisecond();

          while (index < memberValid.length) {
            const batchIds = memberValid.slice(index, index + MAX_BATCH_SIZE);
            const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
            const batchPromises = batchIds.map(async (item, idx) => {
              try {
                const dateItem = getUpdateTimeByIndex(currentTime, idx);
                // find channel arn by internal_channel_id and internal_channel_type
                const channelItem = await this.chimeChatChannelRepo.findOne({
                  select: ['id', 'channel_arn'],
                  where: {
                    internal_channel_type: item.internal_channel_type,
                    internal_channel_id: item.internal_channel_id
                  }
                });

                // add member into chime
                const params = {
                  ChannelArn: channelItem.channel_arn,
                  MemberArn: item.app_instance_user_arn,
                  ChimeBearer: item.app_instance_user_arn,
                  Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
                };
                await chimeMessagingClient.createChannelMembership(params).promise();

                // save into db chime member channel
                const channelMemberEntity = this.chimeChatChannelMemberRepo.create({
                  channel_id: channelItem.id,
                  member_id: item.id,
                  created_date: dateItem,
                  updated_date: dateItem
                });
                await this.chimeChatChannelMemberRepo.save(channelMemberEntity);
                item['status'] = 1;
                itemPass.push(item);
              } catch (error) {
                item['status'] = 0;
                itemPass.push(item);
              }
            });

            await Promise.all(batchPromises);
            index += MAX_BATCH_SIZE;

            // Add a delay to comply with rate limits
            await new Promise((resolve) => setTimeout(resolve, FUNC)); // Adjust the delay as needed
          }
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async removeMembers(data: MemberChannelDTO[], user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    try {
      if (data?.length > 0) {
        const { memberValid, itemFail } = await this.getMemberArn(data);
        if (memberValid?.length > 0) {
          let index = 0;
          const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
          const FUNC = appConfig().chimeDelay;
          const currentTime = getUtcMillisecond();

          while (index < memberValid.length) {
            const batchIds = memberValid.slice(index, index + MAX_BATCH_SIZE);
            const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
            const batchPromises = batchIds.map(async (item, idx) => {
              try {
                const dateItem = getUpdateTimeByIndex(currentTime, idx);
                // find channel arn by internal_channel_id and internal_channel_type
                const channelItem = await this.chimeChatChannelRepo.findOne({
                  select: ['id', 'channel_arn'],
                  where: {
                    internal_channel_type: item.internal_channel_type,
                    internal_channel_id: item.internal_channel_id
                  }
                })
                // remove member into chime
                const params = {
                  ChannelArn: channelItem.channel_arn,
                  MemberArn: item.app_instance_user_arn,
                  ChimeBearer: item.app_instance_user_arn,
                };
                await chimeMessagingClient.deleteChannelMembership(params).promise();
                // delete record in table chime chat channel member
                await this.chimeChatChannelMemberRepo.delete({
                  channel_id: channelItem.id,
                  member_id: item.id
                });
                item['status'] = 1;
                itemPass.push(item);
              } catch (error) {
                item['status'] = 0;
                itemPass.push(item);
              }
            });

            await Promise.all(batchPromises);
            index += MAX_BATCH_SIZE;

            // Add a delay to comply with rate limits
            await new Promise((resolve) => setTimeout(resolve, FUNC)); // Adjust the delay as needed
          }
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async deleteChannels(data: DeleteIntDTO[], user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    // select member arn of this user
    const memberItem = await this.chimeChatMemberRepo.findOne({
      select: ['id', 'app_instance_user_arn'],
      where: {
        internal_user_id: user.userId
      }
    });
    if (!memberItem) {
      throw new NotFoundException('member not found')
    }
    let index = 0;
    const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
    const FUNC = appConfig().chimeDelay;
    while (index < data.length) {
      const batchIds = data.slice(index, index + MAX_BATCH_SIZE);
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const batchPromises = batchIds.map(async (item, idx) => {
        try {
          // find channel arn by internal_channel_id and internal_channel_type
          const channelItem = await this.chimeChatChannelRepo.findOne({
            select: ['id', 'channel_arn'],
            where: {
              internal_channel_type: item.internal_channel_type,
              internal_channel_id: item.internal_channel_id
            }
          })
          // delete channel of chime
          const params = {
            ChannelArn: channelItem.channel_arn,
            ChimeBearer: memberItem.app_instance_user_arn,
          };
          await chimeMessagingClient.deleteChannel(params).promise();

          // delete record in table chime chat channel member
          await Promise.all([
            this.chimeChatChannelMemberRepo.delete({
              channel_id: channelItem.id
            }),
            this.chimeChatChannelRepo.delete({ id: channelItem.id })
          ]);
          item['status'] = 1;
          itemPass.push(item);
        } catch (error) {
          item['status'] = 0;
          itemPass.push(item);
        }
      });

      await Promise.all(batchPromises);
      index += MAX_BATCH_SIZE;

      // Add a delay to comply with rate limits
      await new Promise((resolve) => setTimeout(resolve, FUNC)); // Adjust the delay as needed
    }
    return { itemPass, itemFail };
  }

  async getChatInfoByUser(user_id: number) {
    const chatMember = await this.chimeChatMemberRepo.findOne({
      where: {
        internal_user_id: user_id
      }
    });
    if (!chatMember) {
      throw new NotFoundException('member not found')
    }
    const websocketUrl = await this.generateWebsocketUrl(chatMember.app_instance_user_arn)
    const channels = await this.getChannelByUserId(chatMember.id)
    return {
      data: {
        websocketUrl,
        channels
      }
    }
    //
  }

  async getChannelByUserId(member_id: number) {
    const channelsMember = await this.chimeChatChannelMemberRepo.find({
      where: {
        member_id: member_id
      }
    })
    let channelTargetIds = []
    for (const channelMember of channelsMember) {
      channelTargetIds.push(channelMember.channel_id)
    }
    if (!channelTargetIds.length) {
      return []
    }
    const channels = await this.chimeChatChannelRepo.find({
      where: {
        id: In(channelTargetIds)
      }
    })

    if (!channels.length) {
      return []
    }
    let channelOutput = []
    for (const channel of channels) {
      channelOutput.push({
        channel_arn: channel.channel_arn,
        internal_channel_id: channel.internal_channel_id,
        internal_channel_type: channel.internal_channel_type,
      })
    }
    return channelOutput
  }

  async generateWebsocketUrl(memberArn: string) {
    const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
    const request = await chimeMessagingClient
      .getMessagingSessionEndpoint()
      .promise();
    const hostname = request.Endpoint.Url;
    const wssMemberUrl = await generateWebsocketChatUrl(
      memberArn,
      hostname,
      chimeConfig().region,
      chimeConfig().accessKeyId,
      chimeConfig().secretKey
    );
    return wssMemberUrl;
  }

  async sendMessage(data: MessageIntDTO, { user, headers }: IReq): Promise<any> {
    try {
      const { internal_channel_id, internal_channel_type, metadata, is_realtime = 0 } = data;
      const channelItem = await this.chimeChatChannelRepo.findOne({
        select: ['id', 'channel_arn'],
        where: {
          internal_channel_type,
          internal_channel_id
        }
      });
      if (!channelItem) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.CHANNEL_DOES_NOT_EXIST,
          data,
        );
        return { error: errItem };
      }

      const memberItem = await this.chimeChatMemberRepo.findOne({
        select: ['id', 'app_instance_user_arn'],
        where: {
          internal_user_id: user.userId
        }
      })
      if (!memberItem) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.MEMBER_NOT_EXIST,
          data,
        );
        return { error: errItem };
      }
      const currentTime = getUtcMillisecond();
      const dateItem = getUpdateTimeByIndex(currentTime, 0);
      const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
      const params: SendChannelMessageRequest = {
        Type: 'STANDARD',
        Persistence: 'PERSISTENT',
        Content: data.msg,
        ChannelArn: channelItem.channel_arn,
        ChimeBearer: memberItem.app_instance_user_arn,
        ClientRequestToken: uuidv4(),
        ...(metadata && { Metadata: JSON.stringify(metadata) }),
      };
      const response = await chimeMessagingClient.sendChannelMessage(params).promise();
      const messageEntity = {
        user_id: user.userId,
        internal_message_uid: response?.MessageId,
        is_deleted: 0,
        created_date: dateItem,
        updated_date: dateItem
      };
      await this.chimeChatMessagesRepo.insert(messageEntity);
      // handle realtime process
      if(is_realtime !== REALTIME_STATUS.SEND && response?.MessageId) {
        const channelType = this.realTimeService.getChannelTypeFromNumber(internal_channel_type);
        await this.realTimeService.setHeader(headers).sendChatMessage(
          internal_channel_id, channelType, metadata, data.msg, response?.MessageId);
      }
      return { data: response };

    } catch (error) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        error.message,
        data
      );
      return { error: errItem };
    }
  }

  async editMessage(data: EditMessageIntDTO[], user: IReqUser) {
    const itemPass = [];
    const itemFail = [];
    // select member arn of this user
    const memberItem = await this.chimeChatMemberRepo.findOne({
      select: ['id', 'app_instance_user_arn'],
      where: {
        internal_user_id: user.userId
      }
    });
    if (!memberItem) {
      throw new NotFoundException('member not found')
    }
    // Check message uid of user
    const itemValid = await this.chimeChatMessagesRepo.getValidMessages(
      data.map(item => item.internal_message_uid)
      , user.userId)
    // Filter item invalid
    const { filteredItems, nonMatchingItems } = filterItems(data, itemValid);
    if (nonMatchingItems?.length > 0) {
      itemPass.push(...nonMatchingItems);
    }

    if (filteredItems?.length > 0) {
      let index = 0;
      const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
      const FUNC = appConfig().chimeDelay;
      while (index < filteredItems.length) {
        const batchIds = filteredItems.slice(index, index + MAX_BATCH_SIZE);
        const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
        const batchPromises = batchIds.map(async (item, idx) => {
          try {
            // find channel arn by internal_channel_id and internal_channel_type
            const channelItem = await this.chimeChatChannelRepo.findOne({
              select: ['id', 'channel_arn'],
              where: {
                internal_channel_type: item.internal_channel_type,
                internal_channel_id: item.internal_channel_id
              }
            })
            // delete channel of chime
            const params: UpdateChannelMessageRequest = {
              ChannelArn: channelItem.channel_arn,
              ChimeBearer: memberItem.app_instance_user_arn,
              MessageId: item.internal_message_uid,
              Content: item.msg,
              Metadata: JSON.stringify(item.metadata)
            };
            await chimeMessagingClient.updateChannelMessage(params).promise();
            item['status'] = 1;
            itemPass.push(item);
          } catch (error) {
            item['status'] = 0;
            itemPass.push(item);
          }
        });

        await Promise.all(batchPromises);
        index += MAX_BATCH_SIZE;

        // Add a delay to comply with rate limits
        await new Promise((resolve) => setTimeout(resolve, FUNC)); // Adjust the delay as needed
      }
    }

    return { itemPass, itemFail };
  }

  async handleDeleteMessage(data: DeleteMessageIntDTO[], user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    // select member arn of this user
    const memberItem = await this.chimeChatMemberRepo.findOne({
      select: ['id', 'app_instance_user_arn'],
      where: {
        internal_user_id: user.userId
      }
    });
    if (!memberItem) {
      throw new NotFoundException('member not found')
    }
    // Check message uid of user
    const itemValid = await this.chimeChatMessagesRepo.getValidMessages(
      data.map(item => item.internal_message_uid)
      , user.userId)
    // Filter item invalid
    const { filteredItems, nonMatchingItems } = filterItems(data, itemValid);
    if (nonMatchingItems?.length > 0) {
      itemPass.push(...nonMatchingItems);
    }
    if (filteredItems?.length > 0) {
      let index = 0;
      const MAX_BATCH_SIZE = appConfig().chimeMaxSize;
      const FUNC = appConfig().chimeDelay;
      while (index < filteredItems.length) {
        const batchIds = filteredItems.slice(index, index + MAX_BATCH_SIZE);
        const chimeMessagingClient: ChimeSDKMessaging = await this.createMessagingSTS();
        const batchPromises = batchIds.map(async (item, idx) => {
          try {
            // find channel arn by internal_channel_id and internal_channel_type
            const channelItem = await this.chimeChatChannelRepo.findOne({
              select: ['id', 'channel_arn'],
              where: {
                internal_channel_type: item.internal_channel_type,
                internal_channel_id: item.internal_channel_id
              }
            })
            // delete channel of chime
            const params: DeleteChannelMessageRequest = {
              ChannelArn: channelItem.channel_arn,
              ChimeBearer: this.userInstanceArn,//memberItem.app_instance_user_arn,
              MessageId: item.internal_message_uid
            };
            await chimeMessagingClient.deleteChannelMessage(params).promise();
            item['status'] = 1;
            itemPass.push(item);
            // set delete = 1
            await this.chimeChatMessagesRepo.update({ id: item.id }, { is_deleted: 1 });
          } catch (error) {
            item['status'] = 0;
            itemPass.push(item);
          }
        });

        await Promise.all(batchPromises);
        index += MAX_BATCH_SIZE;

        // Add a delay to comply with rate limits
        await new Promise((resolve) => setTimeout(resolve, FUNC)); // Adjust the delay as needed
      }
    }
    return { itemPass, itemFail };
  }
}