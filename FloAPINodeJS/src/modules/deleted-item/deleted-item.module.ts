import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { DeletedItemService } from './deleted-item.service';
@Module({
  imports: [TypeOrmModule.forFeature([DeletedItem])],
  providers: [DeletedItemService],
  exports: [DeletedItemService]
})
export class DeletedItemModule {}
