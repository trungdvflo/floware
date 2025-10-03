import { BadRequestException, Injectable } from '@nestjs/common';
import { Chime, ChimeSDKMessaging } from 'aws-sdk';
import { SendChannelMessageRequest } from 'aws-sdk/clients/chimesdkmessaging';
import { plainToClass } from 'class-transformer';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import { CHANNEL } from 'common/constants/system.constant';
import { IReqUser } from 'common/interfaces/auth.interface';
import { buildFailItemResponses } from 'common/utils/chatting.respond';
import { generateWebsocketChatUrl } from 'common/utils/chime.util';
import { v4 as uuidv4 } from 'uuid';
import chimeConfig from '../../configs/chime.config';
import { GetChatingDTO, GetDetailChatingDTO } from './dtos/chating.get.dto';
import { MemberChannelDTO } from './dtos/chatting-member.post.dto';
import { DeleteChannelDTO, RemoveMembersDTO } from './dtos/chatting.delete.dto';
import {
  CreateChannelDTO,
  MessageDTO,
  WSSMemberDTO
} from './dtos/chatting.post.dto';
import { ConferenceChatRepository } from './repositories/conferencing-chat.repository';
import { ConferencingMemberRepository } from './repositories/conferencing-member.repository';
import { ConferencingChannelRepository } from './repositories/conferencing.repository';

@Injectable()
export class ChatingService {
  private chimeSDKMessaging: ChimeSDKMessaging;
  private chime: Chime;
  private appInstanceArn: string;
  private userInstanceArn: string;

  constructor(
    private readonly conferencingChannelRepo: ConferencingChannelRepository,
    private readonly conferencingMemberRepo: ConferencingMemberRepository,
    private readonly conferenceChatRepo: ConferenceChatRepository,
  ) {
    this.appInstanceArn = chimeConfig().appInstanceArn;
    this.userInstanceArn = chimeConfig().userInstanceArn;
    this.chimeSDKMessaging = new ChimeSDKMessaging({
      region: chimeConfig().region,
      accessKeyId: chimeConfig().accessKeyId,
      secretAccessKey: chimeConfig().secretKey,
    });
    this.chime = new Chime({
      region: chimeConfig().region,
      accessKeyId: chimeConfig().accessKeyId,
      secretAccessKey: chimeConfig().secretKey,
    });
  }

  async generateWebsocketUrl(data: WSSMemberDTO, userId: number) {
    const dtoWSSMember = plainToClass(WSSMemberDTO, data);
    const channelMemberItem = await this.conferencingMemberRepo.findOne({
      select: ['id', 'member_arn'],
      where: {
        user_id: userId,
        channel_id: dtoWSSMember.channel_id,
      },
    });
    if (!channelMemberItem) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        ErrorMessage.MEMBER_CHANNEL_NOT_EXIST,
        dtoWSSMember,
      );
      return { error: errItem };
    } else {
      // create socket for member
      const hostname = await this.getMessagingSessionEndpoint();
      const wssMember = await generateWebsocketChatUrl(
        channelMemberItem.member_arn,
        hostname,
        chimeConfig().region,
        chimeConfig().accessKeyId,
        chimeConfig().secretKey,
      );
      await this.conferencingMemberRepo.update(
        { member_arn: channelMemberItem.member_arn },
        {
          chat_url: wssMember,
        },
      );
      return { data: wssMember };
    }
  }

  async createChannel(data: CreateChannelDTO, user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    try {
      const channeMemberlItem = await this.channelMemberExisted(
        data.channel_id,
        user.userId,
      );
      if (!channeMemberlItem) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.CHANNEL_DOES_NOT_EXIST,
          data,
        );
        return { error: errItem };
      } else {
        const channelItem = await this.conferencingChannelRepo.findOne({
          select: ['id', 'channel_arn', 'title'],
          where: {
            id: data.channel_id
          },
        });
        const params = {
          Name: channelItem.title,
          AppInstanceArn: this.appInstanceArn,
          Privacy: 'PUBLIC',
          ClientRequestToken: uuidv4(),
          ChimeBearer: this.userInstanceArn,
        };
        const response = await this.chime.createChannel(params).promise();
        // load list of member in conferencing member table and call chime to add
        const lstMembers = await this.getListMembers(channelItem.id);
        if (lstMembers.length > 0) {
          const hostname = await this.getMessagingSessionEndpoint();
          await Promise.all(
            lstMembers.map(async (member) => {
              try {
                const memberEmail = member.email;
                // use chime to create member arn
                const nameMember = memberEmail.slice(
                  0,
                  memberEmail.indexOf('@'),
                );
                const memberInfo = await this.chime
                  .createAppInstanceUser({
                    AppInstanceArn: this.appInstanceArn,
                    AppInstanceUserId: memberEmail,
                    Name: nameMember,
                    ClientRequestToken: member.uid,
                  })
                  .promise();

                // update memmer arn into table conferencing_member
                const params = {
                  ChannelArn: response.ChannelArn,
                  MemberArn: memberInfo.AppInstanceUserArn,
                  ChimeBearer: this.userInstanceArn,
                  Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
                };
                const rsChimeMembers = await this.chime
                  .createChannelMembership(params)
                  .promise();
                // create socket for member
                const wssMember = await generateWebsocketChatUrl(
                  memberInfo.AppInstanceUserArn,
                  hostname,
                  chimeConfig().region,
                  chimeConfig().accessKeyId,
                  chimeConfig().secretKey,
                );
                await Promise.all([
                  this.conferencingChannelRepo.update(
                    { id: data.channel_id },
                    { channel_arn: response.ChannelArn },
                  ),
                  this.conferencingMemberRepo.update(
                    { id: member.id },
                    {
                      member_arn: rsChimeMembers.Member.Arn,
                      chat_url: wssMember,
                    },
                  ),
                ]);
                itemPass.push({ email: memberEmail, member_arn: rsChimeMembers.Member.Arn });
              } catch (error) {
                const msg = error.message || ErrorMessage.MSG_ERR_WHEN_CREATE;
                const errItem = buildFailItemResponses(
                  ErrorCode.BAD_REQUEST,
                  msg,
                  member,
                );
                itemFail.push(errItem);
              }
            }),
          );
        } else {
          const errItem = buildFailItemResponses(
            ErrorCode.BAD_REQUEST,
            ErrorMessage.CHANNEL_EXIST,
            data,
          );
          // return { error: errItem };
        }
        if(itemFail.length > 0) {
          return { error:{ errors: [...itemFail] }};
        }
        return {
          data: {
            id: data.channel_id,
            members: itemPass,
            channel_arn: response.ChannelArn,
          }
        };
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async addMemberChannel(data: MemberChannelDTO, user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    // check channel id is exited
    const channelItem = await this.channelExisted(data.channel_id, user.userId);
    if (!channelItem) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        ErrorMessage.CHANNEL_DOES_NOT_EXIST,
        data,
      );
      return { error: errItem };
    } else {
      const lstMembers = await this.getListMembers(channelItem.id);
      if (lstMembers.length > 0) {
        await Promise.all(
          lstMembers.map(async (member) => {
            try {
              const memberEmail = member.email;
              // use chime to create member arn
              const nameMember = memberEmail.slice(0, memberEmail.indexOf('@'));
              const memberInfo = await this.chime
                .createAppInstanceUser({
                  AppInstanceArn: this.appInstanceArn,
                  AppInstanceUserId: memberEmail,
                  Name: nameMember,
                  ClientRequestToken: member.uid,
                })
                .promise();

              const params = {
                ChannelArn: channelItem.channel_arn,
                MemberArn: memberInfo.AppInstanceUserArn,
                ChimeBearer: this.userInstanceArn,
                Type: 'DEFAULT', // specify 'DEFAULT' for standard members, or 'HIDDEN' for hidden members
              };
              const rsChimeMembers = await this.chime
                .createChannelMembership(params)
                .promise();
              // update memmer arn into table conferencing_member
              await this.conferencingMemberRepo.update(
                { id: member.id },
                {
                  member_arn: rsChimeMembers.Member.Arn,
                },
              );
              itemPass.push({ email: memberEmail, member_arn: rsChimeMembers.Member.Arn });
            } catch (error) {
              const msg = error.message || ErrorMessage.MSG_ERR_WHEN_CREATE;
              const errItem = buildFailItemResponses(
                ErrorCode.BAD_REQUEST,
                msg,
              );
              itemFail.push(errItem);
            }
          }),
        );
      } else {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.MEMBER_EXIST,
          data,
        );
        itemFail.push(errItem);
      }
      if(itemFail.length > 0) {
        return { error:{ errors: [...itemFail] }};
      }
      return { data: itemPass };
    }
  }

  async getListChannels(data: GetChatingDTO, userId: number) {
    const dtoChannel = plainToClass(GetChatingDTO, data);
    try {
      const params = {
        ChannelArn: dtoChannel.channel_arn,
        ChimeBearer: dtoChannel.member_arn,
        MaxResults: dtoChannel.max_results || 10,
        NextToken: dtoChannel.next_token,
      };
      const request = await this.chime.listChannelModerators(params).promise();
      return { data: request };
    } catch (error) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        error.message,
        dtoChannel
      );
      return { error: errItem };
    }
  }

  async getListChannelMessages(data: GetDetailChatingDTO, userId: number) {
    const dtoChannel = plainToClass(GetDetailChatingDTO, data);
    try {
      const memberInfor = await this.conferencingMemberRepo.getInfoMember({
        channelId: data.channel_id,
        userId,
      });
      if (!memberInfor) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.CHANNEL_DOES_NOT_EXIST,
          dtoChannel,
        );
        return { error: errItem };
      } else {
        const params = {
          ChannelArn: memberInfor.channel_arn,
          ChimeBearer: memberInfor.member_arn,
          MaxResults: dtoChannel.max_results || 10,
          NextToken: dtoChannel.next_token,
          SortOrder: 'ASCENDING',
        };
        const request = await this.chimeSDKMessaging
          .listChannelMessages(params)
          .promise();
        return { data: request };
      }
    } catch (error) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        error.message,
        dtoChannel
      );
      return { error: errItem };
    }
  }

  private async sendMessageToChime(params: SendChannelMessageRequest) {
    return await this.chimeSDKMessaging.sendChannelMessage(params).promise();
  }

  async sendMessage(data: MessageDTO, user: IReqUser): Promise<any> {
    try {
      const memberInfor = await this.conferencingMemberRepo.getInfoMember({
        channelId: data.channel_id,
        userId: user.userId,
      });
      if (!memberInfor) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.CHANNEL_DOES_NOT_EXIST,
          data,
        );
        return { error: errItem };
      } else {
        const params = {
          Type: 'STANDARD',
          Persistence: 'PERSISTENT',
          Content: data.msg,
          ChannelArn: memberInfor.channel_arn,
          ChimeBearer: memberInfor.member_arn,
          ClientRequestToken: uuidv4(),
        };
        const response = await this.sendMessageToChime(params);
        return { data: response };
      }
    } catch (error) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        error.message,
        data
      );
      return { error: errItem};
    }
  }

  // async sendFileMessage(data: MessageDTO, user: IReqUser): Promise<any> {
  //   try {
  //     const memberInfor = await this.conferencingMemberRepo.getInfoMember({
  //       channelId: data.channel_id,
  //       userId: user.userId,
  //     });
  //     if (!memberInfor) {
  //       const errItem = buildFailItemResponses(
  //         ErrorCode.BAD_REQUEST,
  //         ErrorMessage.CHANNEL_DOES_NOT_EXIST,
  //         data,
  //       );
  //       return { error: errItem };
  //     } else {
  //       const params = {
  //         Type: 'STANDARD',
  //         Persistence: 'PERSISTENT',
  //         Content: data.msg,
  //         ChannelArn: memberInfor.channel_arn,
  //         ChimeBearer: memberInfor.member_arn,
  //         ClientRequestToken: uuidv4(),
  //       };
  //       const response = await this.sendMessageToChime(params);
  //       // update conferencing chat and link file common table
  //       await this.conferenceChatRepo.update(
  //         { conference_member_id: memberInfor.id },
  //         { message_uid: response.MessageId },
  //       );
  //       return { data: response };
  //     }
  //   } catch (error) {
  //     const errItem = buildFailItemResponses(
  //       ErrorCode.BAD_REQUEST,
  //       error.message,
  //     );
  //     return errItem;
  //   }
  // }

  async getMessagingSessionEndpoint() {
    const request = await this.chimeSDKMessaging
      .getMessagingSessionEndpoint()
      .promise();
    const hostname = request.Endpoint.Url;
    return hostname;
  }

  filterDuplicateItemsWithKey(data: any[], keyFilter: string[]) {
    const dataPassed = data.filter((value, index, self) => {
      if (index === self.findIndex((t) => {
        return keyFilter.reduce((resource, keyItem) => {
          return resource && t[keyItem] === value[keyItem];
        }, true);
      })) {
        return value;
      }
    });
    return dataPassed
  }

  async removeMember(data: RemoveMembersDTO, user: IReqUser): Promise<any> {
    try {
      const itemPass = [];
      const itemFail = [];
      const channelItem = await this.channelExisted(
        data.channel_id,
        user.userId,
      );
      if (!channelItem) {
        const errItem = buildFailItemResponses(
          ErrorCode.BAD_REQUEST,
          ErrorMessage.CHANNEL_DOES_NOT_EXIST,
          data,
        );
        return { error: errItem };
      } else {
        // filter dubplicate member
        const uniqueMember = this.filterDuplicateItemsWithKey(data.members, ['email']);
        await Promise.all(
          uniqueMember.map(async (item) => {
            const channelMemberItem = await this.channelEmailMemberExisted(
              data.channel_id,
              item.email,
            );
            if (!channelMemberItem) {
              const errItem = buildFailItemResponses(
                ErrorCode.BAD_REQUEST,
                ErrorMessage.MEMBER_NOT_EXIST,
                item,
              );
              itemFail.push(errItem);
            } else {
              // remove member out of channel
              try {
                const params = {
                  ChannelArn: channelItem.channel_arn,
                  MemberArn: channelMemberItem.member_arn,
                  ChimeBearer: this.userInstanceArn,
                };
                await this.chime.deleteChannelMembership(params).promise();
                itemPass.push({ email: item.email });
              } catch (error) {
                const errItem = buildFailItemResponses(
                  ErrorCode.BAD_REQUEST,
                  error.message,
                );
                itemFail.push(errItem);
              }
            }
          }),
        );
        if(itemFail.length > 0) {
          return { error:{ errors: [...itemFail] }};
        }
        return { data: itemPass };
      }
    } catch (error) {
    }
  }

  async deleteChannel(data: DeleteChannelDTO[], user: IReqUser): Promise<any> {
    const itemPass = [];
    const itemFail = [];
    await Promise.all(
      data.map(async (item, index) => {
        const channelItem = await this.channelExisted(item.id, user.userId);
        if (!channelItem) {
          const errItem = buildFailItemResponses(
            ErrorCode.BAD_REQUEST,
            ErrorMessage.CHANNEL_DOES_NOT_EXIST,
            item,
          );
          itemFail.push(errItem);
        } else {
          // delete channel on Chime
          try {
            const params = {
              ChannelArn: channelItem.channel_arn,
              ChimeBearer: this.userInstanceArn,
            };
            await this.chime.deleteChannel(params).promise();
            itemPass.push({ id: item.id });
          } catch (error) {
            const errItem = buildFailItemResponses(
              ErrorCode.BAD_REQUEST,
              error.message,
              item,
            );
            itemFail.push(errItem);
          }
        }
      }),
    );
    return { itemPass, itemFail };
  }

  private async channelExisted(channelId: number, userId: number) {
    const channelItem = await this.conferencingChannelRepo.findOne({
      select: ['id', 'channel_arn', 'title'],
      where: {
        user_id: userId,
        id: channelId,
      },
    });
    return channelItem;
  }

  private async channelEmailMemberExisted(channelId: number, email: string) {
    const channelMemberItem = await this.conferencingMemberRepo.findOne({
      select: ['id', 'member_arn'],
      where: {
        email,
        channel_id: channelId,
        revoke_time: CHANNEL.NONE_REVOKE,
      },
    });
    return channelMemberItem;
  }

  private async channelMemberExisted(channelId: number, memberId: number) {
    const channelMemberItem = await this.conferencingMemberRepo.findOne({
      select: ['id', 'member_arn'],
      where: {
        user_id: memberId,
        channel_id: channelId,
        revoke_time: CHANNEL.NONE_REVOKE,
      },
    });
    return channelMemberItem;
  }

  private async getListMembers(channelId: number) {
    const memberItems = await this.conferencingMemberRepo.find({
      where: {
        channel_id: channelId,
        revoke_time: CHANNEL.NONE_REVOKE,
      },
    });
    return memberItems;
  }

  // private async deleteChannelById(channelId: number) {
  //   const isDelChannel = await this.conferencingChannelRepo.delete({
  //     id: channelId,
  //   });
  //   return isDelChannel;
  // }

  // private async deleteChannelMemberByChannelId(channelId: number) {
  //   const isDelChannelMember = await this.conferencingMemberRepo.delete({
  //     channel_id: channelId,
  //   });
  //   return isDelChannelMember;
  // }
}
