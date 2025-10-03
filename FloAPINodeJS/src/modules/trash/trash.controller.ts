import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { TrashEntity } from '../../common/entities/trash.entity';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { TrashCreateDto, TrashCreateDtos } from './dtos/trash.create.dto';
import { TrashDeleteDto, TrashDeleteDtos } from './dtos/trash.delete.dto';
import { TrashRecoverDto, TrashRecoverDtos } from './dtos/trash.recover.dto';
import {
  TrashCreateReponse,
  TrashDeleteReponse,
  TrashGetReponse,
  TrashRecoverReponse
} from './dtos/trash.respone-sample.swagger';
import { TrashUpdateDto, TrashUpdateDtos } from './dtos/trash.update.dto';
import { TrashService } from './trash.service';

@ApiTags('Trash Collections')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.trashCtr.mainPath)
export class TrashController {
  constructor(
    private readonly trashService: TrashService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get list Trash',
    description: 'Get list of Trash objects',
  })
  @ApiResponse(TrashGetReponse.RES_200)
  async findAll(
    @Query(new GetAllValidationPipe({ entity: TrashEntity }))
    filter: GetAllFilter<TrashEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.trashService.findAll(filter, req as IReq);
    return dataRespond;
  }

  @Post()
  @ApiOperation({
    summary: 'Move list objects to Trash',
    description:
      'Create a list records object in trash, turn is_trashed of object on 1.\
        Worker will be run, collect items and update trash.',
  })
  @ApiResponse(TrashCreateReponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async create(
    @Body(new BatchValidationPipe({ items: TrashCreateDto, key: 'data' }))
    body: TrashCreateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.trashService.saveBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }

  async update(
    @Body(new BatchValidationPipe({ items: TrashUpdateDto, key: 'data' }))
    body: TrashUpdateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.trashService.updateBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }

  @Post(routestCtr.trashCtr.deletePath)
  @ApiOperation({
    summary: 'Delete objects from Trash',
    description:
      'Turn status of trash record on 2. \
      Worker will be run, collect item and remove it.',
  })
  @ApiResponse(TrashDeleteReponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Body(new BatchValidationPipe({ items: TrashDeleteDto, key: 'data' }))
    body: TrashDeleteDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.trashService.deleteBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }

  @Post(routestCtr.trashCtr.recoverPath)
  @ApiOperation({
    summary: 'Recover a objects from Trash, undo deleted',
    description: 'Update is_trash of the object is 0, delete trash record by id.',
  })
  @ApiResponse(TrashRecoverReponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async recover(
    @Body(new BatchValidationPipe({ items: TrashRecoverDto, key: 'data' }))
    body: TrashRecoverDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.trashService.recoverBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }
}
