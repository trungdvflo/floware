import {
  Body,
  ClassSerializerInterceptor,
  Controller, Get, Put,
  Query,
  Req, UseFilters, UseInterceptors
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GlobalSetting } from '../../common/entities';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { IReq, IUser } from '../../common/interfaces';
import { GetAllValidationPipe, SingleValidationPipe } from '../../common/pipes/validation.pipe';
import { routestCtr } from '../../configs/routes';
import { GetGlobalSettingDto } from './dto/get-global-setting.dto';
import { UpdateGlobalSettingDtos } from './dto/update-global-setting.dto';
import { GlobalSettingService } from './setting.service';
@ApiTags('Global Setting')
@Controller(routestCtr.settingCtr.mainPath)
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(BaseBadRequestValidationFilter)
export class GlobalSettingController {
  constructor(
    private readonly globalSettingService: GlobalSettingService,
  ) { }

  @Get()
  async findAll(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: GlobalSetting }))
    filter: GetGlobalSettingDto,
  ) {
    const user: IUser = req.user;
    return this.globalSettingService.findAll(user.userId, filter);
  }

  @Put()
  async update(
    @Body(new SingleValidationPipe({ items: UpdateGlobalSettingDtos, key: 'data' }))
    body: UpdateGlobalSettingDtos, @Req() req) {
    const rs = await this.globalSettingService
      .updateSetting(body.data, req as IReq);
    return rs;
  }
}
