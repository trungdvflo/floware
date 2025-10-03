import { Injectable } from '@nestjs/common';
import { FindManyOptions, In, InsertResult, Repository, UpdateResult } from 'typeorm';
import { INSERT_LAST_MODIFY } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { ApiLastModified } from '../entities/api-last-modified.entity';
import { IUser } from '../interfaces';
import { getPlaceholderByN } from '../utils/common';
import { TimestampDouble } from '../utils/date.util';
export type ILastModify = { api_name: string; updated_date: number };
export type ILastModifyCollection = {
  collection_id: number;
  api_name: string;
  updated_date: number
};
@Injectable()
@CustomRepository(ApiLastModified)
export class ApiLastModifiedRepository extends Repository<ApiLastModified> {
  async findByApiNames(apiNames: string[] = [], userId): Promise<Partial<ApiLastModified>[]> {
    const options: FindManyOptions<ApiLastModified> = {
      select: ['id', 'api_name', 'api_modified_date', 'user_id'],
      where: { user_id: userId }
    };

    if (apiNames.length > 0) {
      options.where['api_name'] = In(apiNames);
    }
    return this.find(options);
  }

  async insertEntity(input: Partial<ApiLastModified>): Promise<InsertResult> {
    input.created_date = TimestampDouble();
    input.updated_date = TimestampDouble();
    return this.insert(input);
  }

  async updateEntity(id: number, input: Partial<ApiLastModified>)
    : Promise<UpdateResult> {
    input.updated_date = TimestampDouble();
    return this.update(+id, input);
  }

  async upsertEntity(apiName: string, apiModifiedDate: number, userId: number) {
    const [existedEntity] = await this.findByApiNames([apiName], userId);
    if (existedEntity) {
      return this.updateEntity(existedEntity.id, {
        api_modified_date: apiModifiedDate,
        user_id: existedEntity.user_id
      });
    } else {
      return this.insertEntity({
        api_modified_date: apiModifiedDate,
        api_name: apiName,
        user_id: userId
      });
    }
  }

  async insertLastModify({ api_name, updated_date }: ILastModify, user: IUser) {
    try {
      if (!api_name) {
        return 0;
      }
      const { callType, spName, spParam } = INSERT_LAST_MODIFY;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`,
          [
            api_name,
            user.id,
            updated_date
          ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};
      if (!updated || updated.id < 1) {
        return {
          error: 'APIs [invalid] are not supported'
        };
      }
      return updated;
    } catch (error) {
      return { error };
    }
  }
}
