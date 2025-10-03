import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ChimeChatMemberEntity } from 'entities/chime_chat_member.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ChimeChatMemberEntity)
export class ChimeChatMemberRepo extends Repository<ChimeChatMemberEntity> {}
