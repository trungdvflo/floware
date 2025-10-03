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
  ApiBadRequestResponse, ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { MSG_TOKEN_INVALID } from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { MetadataEmail } from '../../common/entities/metadata-email.entity';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IUser } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { routestCtr } from '../../configs/routes';
import { CreateMetadataEmailDTO, CreateMetadataEmailDTOs } from './dtos/create-metadata-email.dto';
import { DeleteMetadataEmailDTO, DeleteMetadataEmailDTOs } from './dtos/delete-metadata-email.dto';
import { DeleteMetadataEmailResponse } from './dtos/delete-metadata-email.response';
import { GetMetadataEmailResponse } from './dtos/get-metadata-email.response';
import { UpdateMetadataEmailDTO, UpdateMetadataEmailDTOs } from './dtos/update-metadata-email.dto';
import { UpdateMetadataEmailResponse } from './dtos/update-metadata-email.response';
import { MetadataEmailService } from './metadata-email.service';

@Controller(routestCtr.metadataEmailCtr.mainPath)
@ApiTags('Metadata Email')
@UseInterceptors(HttpResponseCodeInterceptor)
export class MetadataEmailController {
  constructor(private readonly service: MetadataEmailService) { }

  @Get()
  @ApiOperation({
    summary: 'Get metadata email',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: GetMetadataEmailResponse })
  @ApiBadRequestResponse({ type: ValidationException })
  async findAll(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: MetadataEmail })) filter: GetAllFilter<MetadataEmail>,
  ) {
    const user: IUser = req.user;
    return this.service.findAll(user.userId, filter);
  }

  @Post()
  @ApiOperation({
    summary: 'Create multiple metadata email',
  })
  @ApiBadRequestResponse({ type: ValidationException })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: UpdateMetadataEmailResponse })
  async create(
    @Body(new BatchValidationPipe({ items: CreateMetadataEmailDTO, key: 'data' }))
    body: CreateMetadataEmailDTOs,
    @Req() req,
  ) {
    const user: IUser = req.user;
    const { data: metadata, errors: validationErrors } = body;
    const { created, errors: logicalErrors } = await this.service.createMultiple(
      metadata, req
    );

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
    summary: 'Update multiple metadata email',
  })
  @ApiBadRequestResponse({ type: ValidationException })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: UpdateMetadataEmailResponse })
  async update(
    @Body(new BatchValidationPipe({ items: UpdateMetadataEmailDTO, key: 'data' }))
    body: UpdateMetadataEmailDTOs,
    @Req() req,
  ) {
    const { data: metadata, errors: validationErrors } = body;
    const { updated, errors: logicalErrors } = await this.service.updateMultiple(
      metadata, req
    );

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

  @Post(routestCtr.metadataEmailCtr.deletePath)
  @ApiOperation({
    summary: 'Delete multiple metadata email',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: DeleteMetadataEmailResponse })
  @ApiBadRequestResponse({ type: ValidationException })
  async removeMultiple(
    @Body(new BatchValidationPipe({ items: DeleteMetadataEmailDTO, key: 'data' }))
    body: DeleteMetadataEmailDTOs,
    @Req() req,
  ) {
    const { data: metadata, errors: validationErrors } = body;
    const { removed, errors: logicalErrors } = await this.service.removeMultiple(
      metadata, req
    );

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
