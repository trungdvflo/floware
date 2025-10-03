import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { MSG_TOKEN_INVALID } from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Tracking } from '../../common/entities/tracking.entity';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { routestCtr } from '../../configs/routes';
import { CreateTrackingDTO, CreateTrackingDTOs } from './dtos/create-tracking.dto';
import { DeleteTrackingDTO, DeleteTrackingDTOs } from './dtos/delete-tracking.dto';
import { DeleteTrackingResponse } from './dtos/delete-tracking.response';
import { GetTrackingResponse } from './dtos/get-tracking.response';
import { UpdateTrackingDTO, UpdateTrackingDTOs } from './dtos/update-tracking.dto';
import { UpdateTrackingResponse } from './dtos/update-tracking.response';
import { TrackingService } from './tracking.service';
import { IReq } from '../../common/interfaces';

@Controller(routestCtr.trackingCtr.mainPath)
@ApiTags('Tracking')
@UseInterceptors(HttpResponseCodeInterceptor)
export class TrackingController {
  constructor(private readonly service: TrackingService) { }

  @Get()
  @ApiOperation({
    summary: 'Get email trackings',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({
    description: 'Get email trackings.',
    type: GetTrackingResponse,
  })
  @ApiBadRequestResponse({ type: ValidationException })
  async findAll(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: Tracking }))
    filter: GetAllFilter<Tracking>,
  ) {
    const dataRespond = await this.service.findAll(
      filter, req as IReq);
    return dataRespond;
  }

  @Post()
  @ApiOperation({
    summary: 'Create multiple email trackings',
  })
  @ApiBadRequestResponse({ type: ValidationException })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: UpdateTrackingResponse })
  async create(
    @Body(new BatchValidationPipe({ items: CreateTrackingDTO, key: 'data' }))
    body: CreateTrackingDTOs,
    @Req() req,
  ) {
    const { data: trackings, errors: validationErrors } = body;
    if (trackings.length === 0 && validationErrors.length > 0) {
      return {
        data: [],
        error: {
          errors: [...validationErrors],
        },
      };
    }
    const { created, errors: logicalErrors } = await this.service.createMultiple(
      trackings, req as IReq);
    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: created,
      };

    return {
      data: created,
      error: {
        errors,
      },
    };
  }

  @Put()
  @ApiOperation({
    summary: 'Update multiple email trackings',
  })
  @ApiBadRequestResponse({ type: ValidationException })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: UpdateTrackingResponse })
  async update(
    @Body(new BatchValidationPipe({ items: UpdateTrackingDTO, key: 'data' }))
    body: UpdateTrackingDTOs,
    @Req() req,
  ) {
    const { data: trackings, errors: validationErrors } = body;
    if (trackings.length === 0 && validationErrors.length > 0) {
      return {
        data: [],
        error: {
          errors: [...validationErrors],
        },
      };
    }
    const { updated, errors: logicalErrors } = await this.service.updateMultiple(
      trackings, req as IReq);

    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: updated,
      };

    return {
      data: updated,
      error: {
        errors,
      },
    };
  }

  @Post(routestCtr.trackingCtr.deletePath)
  @ApiOperation({
    summary: 'Delete multiple email trackings',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: DeleteTrackingResponse })
  @ApiBadRequestResponse({ type: ValidationException })
  async removeMultiple(
    @Body(new BatchValidationPipe({ items: DeleteTrackingDTO, key: 'data' }))
    body: DeleteTrackingDTOs,
    @Req() req,
  ): Promise<DeleteTrackingResponse> {
    const { data: trackings, errors: validationErrors } = body;
    const { removed, errors: logicalErrors } = await this.service.removeMultiple(
      trackings,
      req as IReq);

    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: removed,
      };

    return {
      data: removed,
      error: {
        errors,
      },
    };
  }
}
