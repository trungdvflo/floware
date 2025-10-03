import { Controller, Get, Headers, NotFoundException, Query, UseFilters, UsePipes } from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_APPREG_INVALID } from '../../common/constants/message.constant';
import { BaseNotFoundValidationFilter } from '../../common/filters/validation-exception.filters';
import { routestCtr } from '../../configs/routes';
import { GetPlatformReleaseDto, GetPlatformReleaseResponse } from './dto/get-platform-release.dto';
import { GetPlatformReleaseNotFoundError } from './errors/platform-release.error';
import { PlatformReleaseValidationPipe } from './platform-release-validation.pipe';
import { PlatformReleaseService } from './platform-release.service';

@ApiTags('Platform Release')
@Controller(routestCtr.platFormCtr.mainPath)
@UseFilters(BaseNotFoundValidationFilter)
export class PlatformReleaseController {
  constructor(private readonly platformReleaseService: PlatformReleaseService) { }

  @Get()
  @ApiOperation({
    summary: 'Check latest platform release',
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        message: MSG_APPREG_INVALID,
        code: ErrorCode.BAD_REQUEST,
      },
    },
  })
  @ApiOkResponse({ type: GetPlatformReleaseResponse })
  @ApiNotFoundResponse({ type: GetPlatformReleaseNotFoundError })
  @UsePipes(new PlatformReleaseValidationPipe())
  async findAll(
    @Headers('app_id') appId,
    @Query() getPlatformReleaseDto: GetPlatformReleaseDto,
  ): Promise<GetPlatformReleaseResponse> {
    try {
      return await this.platformReleaseService.getForcedUpdateRelease(getPlatformReleaseDto, appId);
    } catch (error) {
      if (error instanceof GetPlatformReleaseNotFoundError) {
        throw new NotFoundException({
          code: ErrorCode.PLATFORM_RELEASE_NOT_FOUND,
          message: error,
        });
      }
      throw error;
    }
  }
}
