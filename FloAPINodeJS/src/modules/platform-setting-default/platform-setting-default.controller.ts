import { Controller, Get, Query, Req, UseFilters } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetAllFilterPlatFormSettingDefault } from "../../common/dtos/get-all-filter";
import { PlatformSettingDefault } from "../../common/entities/platform-setting-default.entity";
import { BadRequestValidationFilter, UnknownExceptionFilter } from "../../common/filters/validation-exception.filters";
import { GetAllValidationPipe } from "../../common/pipes/validation.pipe";
import { PLATFORM_SETTING_DEFAULT_API_TAG } from "../../common/swaggers/common.swagger";
import { routestCtr } from "../../configs/routes";
import { PlatformSettingDefaultService } from "./platform-setting-default.service";

@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.platFormSettingDefaultCtr.mainPath)
@ApiTags(PLATFORM_SETTING_DEFAULT_API_TAG)
export class PlatformSettingDefaultController {
  constructor(
    private readonly instanceService: PlatformSettingDefaultService,
  ) {}

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: PlatformSettingDefault }))
    filter: GetAllFilterPlatFormSettingDefault<PlatformSettingDefault>,
    @Req() req,
  ) {
    const dataRespond = await this.instanceService.getAllFilters(filter, req.user);
    return dataRespond;
  }
}