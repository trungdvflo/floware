import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post, Query,
    Req,
    UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllFilter4CollectionAdnUID } from '../../common/dtos/get-all-filter';
import { CollectionActivity } from '../../common/entities/collection-activity.entity';
import { CollectionHistory } from '../../common/entities/collection-history.entity';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq, IUser } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CreateHistoryDto, CreateHistoryDtos } from './dtos/history.create.dto';
import { DeleteHistoryDto, DeleteHistoryDtos } from './dtos/history.delete.dto';
import { DeleteHistoryResponse, HistoryCreateResponse, HistoryGetResponse } from './dtos/history.respone-sample.swagger';
import { HistoryService } from './history.service';
@ApiTags('Collection History')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.colHistoryCtr.mainPath)
export class HistoryController {
    constructor(
        private readonly historyService: HistoryService
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get all channel',
        description:
            'Get all channel of this user',
    })
    @ApiResponse(HistoryGetResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async index(
        @Query(new GetAllValidationPipe({ entity: CollectionHistory }))
        filter: GetAllFilter4CollectionAdnUID<CollectionHistory & CollectionActivity>,
        @Req() req,
    ) {
        const user: IUser = req.user;
        const dataRespond =
            await this.historyService.getAllHistories(filter, req as IReq);
        return dataRespond;
    }

    @Post()
    @ApiOperation({
        summary: 'Create list of history',
        description:
            'Create list of history and return the creator\'s history properties',
    })
    @ApiResponse(HistoryCreateResponse.RES_200)
    @HttpCode(HttpStatus.CREATED)
    async createHistory(
        @Body(new BatchValidationPipe({ items: CreateHistoryDto, key: 'data' }))
        body: CreateHistoryDtos,
        @Req() req,
    ) {
        const { data, errors } = body;
        if (data.length === 0) {
            return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
        }
        const { itemPass, itemFail } = await this.historyService
            .createBatchHistory(data, req as IReq);
        if (itemFail && itemFail.length > 0) {
            itemFail.forEach((item) => errors.push(item));
        }
        const dataRespond: IDataRespond = new Object();
        // Just respond fields have value
        if (itemPass.length > 0) dataRespond.data = itemPass;
        if (errors.length > 0) dataRespond.errors = errors;

        return new MultipleRespond(dataRespond).multipleRespond();
    }

    @ApiOperation({
        summary: 'Remove histories',
        description:
            'Remove list of histories',
    })
    @Post(`${routestCtr.colHistoryCtr.deletePath}`)
    @ApiResponse(DeleteHistoryResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async deleteMember(
        @Body(new BatchValidationPipe({ items: DeleteHistoryDto, key: 'data' }))
        body: DeleteHistoryDtos,
        @Req() req,
    ) {
        const { data, errors } = body;
        if (data.length === 0) {
            return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
        }
        const { itemPass, itemFail } = await this.historyService
            .deleteBatchHistory(data, req as IReq);
        if (itemFail && itemFail.length > 0) {
            itemFail.forEach((item) => errors.push(item));
        }
        const dataRespond: IDataRespond = new Object();
        // Just respond fields have value
        if (itemPass.length > 0) dataRespond.data = itemPass;
        if (errors.length > 0) dataRespond.errors = errors;
        return new MultipleRespond(dataRespond).multipleRespond();
    }
}