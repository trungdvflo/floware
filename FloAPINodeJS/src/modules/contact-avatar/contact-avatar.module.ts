import { Module } from '@nestjs/common';
import { ContactAvatarController } from './contact-avatar.controller';
import { ContactAvatarService } from './contact-avatar.service';

@Module({
  controllers: [ContactAvatarController],
  providers: [ContactAvatarService],
  exports: [ContactAvatarService]
})
export class ContactAvatarModule {}
