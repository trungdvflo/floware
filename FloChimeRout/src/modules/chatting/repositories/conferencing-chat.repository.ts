import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ConferenceChat } from 'entities/conference_chat.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ConferenceChat)
export class ConferenceChatRepository extends Repository<ConferenceChat> {}
