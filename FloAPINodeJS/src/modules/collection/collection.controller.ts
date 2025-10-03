import { Body, Controller, Get, Post, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Collection } from '../../common/entities/collection.entity';
import { ResponseMappingInterceptor } from '../../common/interceptors';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/collection.swagger';
import { routestCtr } from '../../configs/routes';
import { CollectionService } from './collection.service';
import {
  CreateCollectionBatchRequest,
  CreateCollectionParam,
  CreateCollectionResponse,
  DeleteCollectionBatchRequest,
  DeleteCollectionDTO,
  DeleteCollectionResponse,
  UpdateCollectionBatchRequest,
  UpdateCollectionParam,
  UpdateCollectionResponse
} from './dto';
@UseInterceptors(ResponseMappingInterceptor)
@ApiTags(nameSwagger)
@Controller(routestCtr.collectionCtr.mainPath)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: Collection }))
    filter: GetAllFilter<Collection>,
    @Req() req,
  ) {
    const dataRespond = await this.collectionService.getAllFiles(filter, req.user.userId);
    return dataRespond;
  }

  @Post()
  @ApiOperation({
    summary: 'Create Collections of Flo user',
    description: 'Batch create collections of the current user',
  })
  public async create(
    @Body(new BatchValidationPipe({ items: CreateCollectionParam, key: 'data' }))
    body: CreateCollectionBatchRequest, @Req() req): Promise<CreateCollectionResponse> {
    const { data: collections, errors: validationErrors } = body;
    const { created, errors: logicalErrors } = await this.collectionService.createBatchCollections(
      collections,
      req
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
    summary: 'Update Collections of Flo user',
    description: 'Batch update collections of the current user',
  })
  public async update(
    @Body(new BatchValidationPipe({ items: UpdateCollectionParam, key: 'data' }))
    body: UpdateCollectionBatchRequest, @Req() req): Promise<UpdateCollectionResponse> {
    const { data, errors: validationErrors } = body;
    const {
      updated,
      errors: logicalErrors,
    } = await this.collectionService.updateBatchCollectionsWithReturn(data, req as IReq);

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

  @Post(routestCtr.collectionCtr.deletePath)
  @ApiOperation({
    summary: 'Delete Collections of Flo user',
    description: 'Batch delete collections of the current user',
  })
  public async delete(
    @Body(new BatchValidationPipe({ items: DeleteCollectionDTO, key: 'data' }))
    body: DeleteCollectionBatchRequest,
    @Req() req,
  ): Promise<DeleteCollectionResponse> {
    const { data, errors: validationErrors } = body;
    const rsData = await this.collectionService.batchDelete(
      data,
      req
    );
    const errors = [...validationErrors, ...rsData.errors];
    if (errors.length === 0)
      return {
        data: rsData.deleted,
      };
    return {
      data: rsData.deleted,
      error: {
        errors,
      },
    };
  }
}