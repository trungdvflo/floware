import { Injectable } from '@nestjs/common';
import { BaseEntity, Repository } from 'typeorm';

// defined method logic action with database
@Injectable()
export class BaseRepository <T extends BaseEntity> extends Repository<T> {
  // TODO
}