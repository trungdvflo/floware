import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ConferenceChannel } from 'entities/conference_channel.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ConferenceChannel)
export class ConferencingChannelRepository extends Repository<ConferenceChannel> {}
