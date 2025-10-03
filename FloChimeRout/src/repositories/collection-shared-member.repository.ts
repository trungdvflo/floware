import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { ShareMemberEntity } from 'entities/share-member.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(ShareMemberEntity)
export class ShareMemberRepo extends Repository<ShareMemberEntity> {}