import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ChimeChatChannelMemberEntity } from 'entities/chime_chat_channel_member.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ChimeChatChannelMemberEntity)
export class ChimeChatChannelMemberRepo extends Repository<ChimeChatChannelMemberEntity> {}
