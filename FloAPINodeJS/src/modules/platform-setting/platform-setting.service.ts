import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiLastModifiedName } from '../../common/constants';
import { PlatformSetting } from '../../common/entities/platform-setting.entity';
import { IReq } from '../../common/interfaces';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CreatePlatformSettingDto } from './dto/create-platform-setting.dto';
import { ParamPlatformSettingDto } from './dto/param-platform-setting.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';

@Injectable()
export class PlatformSettingService {

  constructor(
    @InjectRepository(PlatformSetting)
    private readonly pfsRepo: Repository<PlatformSetting>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService
  ) { }

  async ping(dto: CreatePlatformSettingDto): Promise<number> {
    const ping = await this.pfsRepo.count({
      where: {
        app_reg_id: dto.app_reg_id,
        app_version: dto.app_version,
        user_id: dto.user_id
      }
    });
    return ping;
  }

  async create(dto: CreatePlatformSettingDto, {user, headers}: IReq) {
    const platformSettingDto: PlatformSetting = await this.pfsRepo.create(dto);
    const rs = await this.pfsRepo.save(platformSettingDto);
    if (rs) {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.PLATFORM_SETTING,
        userId: dto.user_id,
        email: user.email,
        updatedDate: rs.updated_date
      }, headers);
    }
    // TODO: need to refrator all code
    if (rs.id) {
      rs.id = parseInt(rs.id.toString(), 0);
    }
    return rs;
  }

  find(q: ParamPlatformSettingDto) {
    const _where = {
      user_id: q.user_id,
      app_version: q.app_version,
      app_reg_id: q.app_reg_id,
    };
    if (q.app_version.toLowerCase() === 'all') {
      delete _where.app_version;
    }
    return this.pfsRepo.find({
      where: _where
    });
  }

  async update(dto: UpdatePlatformSettingDto, { user, headers }: IReq) {
    const item = await this.pfsRepo.findOne({
      where: { id: dto.id }
    });
    if (item) {
      // workaround for update
      dto.updated_date = (new Date()).getTime() / 1000;
      const platformSettingDto: PlatformSetting = await this.pfsRepo.create({ ...item, ...dto });
      const res = await this.pfsRepo.update({
        id: dto.id,
        user_id: dto.user_id
      }, platformSettingDto);

      if (res && res.affected) {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.PLATFORM_SETTING,
          userId: dto.user_id,
          email: user.email,
          updatedDate: dto.updated_date
        }, headers);
        return {
          ...item,
          ...platformSettingDto
        };
      }
    }
    return null;
  }
}
