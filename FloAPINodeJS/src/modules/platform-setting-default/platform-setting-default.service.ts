import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GetAllFilterPlatFormSettingDefault } from "../../common/dtos/get-all-filter";
import { PlatformSettingDefault } from "../../common/entities/platform-setting-default.entity";
import { IUser } from "../../common/interfaces";
import { filterGetAllFields } from "../../common/utils/typeorm.util";

@Injectable()
export class PlatformSettingDefaultService {
  constructor(
    @InjectRepository(PlatformSettingDefault)
    private readonly platSettingDefaultRepo: Repository<PlatformSettingDefault>,
  ) { }

  private getAll(options: GetAllFilterPlatFormSettingDefault<PlatformSettingDefault>) {
    const { modified_gte, modified_lt, min_id, page_size, ids, app_reg_id, app_version }
      = options;
    const aliasName = this.platSettingDefaultRepo.metadata.name;
    const fields = filterGetAllFields(this.platSettingDefaultRepo, options.fields);

    let query = this.platSettingDefaultRepo
      .createQueryBuilder(aliasName)
      .select(fields && fields.map(f => `${aliasName}.${String(f)}`))
     .where(`${aliasName}.app_reg_id = :app_reg_id`, { app_reg_id });

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${aliasName}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${aliasName}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${aliasName}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${aliasName}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasName}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasName}.id`, "ASC");
    }
    if(ids) {
      query = query.andWhere(`${aliasName}.id IN (:...ids)`, { ids });
    }
    if(app_version) {
      query = query.andWhere(`${aliasName}.app_version = :app_version`, { app_version });
    }
    return query.limit(page_size).getMany();
  }

  async getAllFilters(filter: GetAllFilterPlatFormSettingDefault<PlatformSettingDefault>
    , user: IUser) {
    filter.app_reg_id = user.appId;
    const platformSetting: PlatformSettingDefault[]
    = await this.getAll(filter);

    return {
      data: platformSetting
    };
  }
}