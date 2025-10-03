import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseFilters,
    UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpSingleResponseCodeInterceptor } from '../../common/interceptors';
import { SingleValidationPipe } from '../../common/pipes/validation.pipe';
import { SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ClientReportErrorService } from './client-report-error.service';
import { ReportErrorResponse } from './dto/report-error.respone-sample.swagger';
import { WebsocketErrorParam } from './dto/websocket-error.dto';

@ApiTags('Client report error')
@UseFilters(BaseBadRequestValidationFilter)
@UseInterceptors(HttpSingleResponseCodeInterceptor)
@Controller(routestCtr.clientReportErrorCtr.mainPath)
export class ClientReportErrorController {
    constructor(
        private readonly clientReportErrorService: ClientReportErrorService
    ) { }

    @Post(routestCtr.clientReportErrorCtr.realtimePath)
    @ApiOperation({
        summary: 'Report error websocket connect',
        description: 'Client call this api when has error connect to websocket',
    })
    @ApiResponse(ReportErrorResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async reportRealtimeError(
        @Body(new SingleValidationPipe({ items: WebsocketErrorParam, key: 'data' }))
        body: WebsocketErrorParam,
        @Req()
        req
    ) {
        const { data, errors } = body;
        const rs = await this.clientReportErrorService
            .sendReportErrorWebsocket(data, req);
        return new SingleRespond({ data, error: errors }).singleData();
    }

}