import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { ChatingController } from './chatting.controller';
import { ChatingService } from './chatting.service';
import { ConferenceChatRepository } from './repositories/conferencing-chat.repository';
import { ConferencingMemberRepository } from './repositories/conferencing-member.repository';
import { ConferencingChannelRepository } from './repositories/conferencing.repository';
import { DeleteItemRepository } from './repositories/delete-item.repository';
import { UsersRepository } from './repositories/user.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmExModule.forCustomRepository([
      ConferencingChannelRepository,
      ConferencingMemberRepository,
      ConferenceChatRepository,
      UsersRepository,
      DeleteItemRepository,
    ]),
  ],
  controllers: [ChatingController],
  providers: [ChatingService],
})
export class ChatingModule {}
