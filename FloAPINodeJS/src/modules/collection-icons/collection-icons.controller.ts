import {
    Controller,
    Get,
    HttpCode,
    HttpStatus, Query,
    Req,
    UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllFilter4Shortcut } from '../../common/dtos/get-all-filter';
import { CollectionIcon } from '../../common/entities/collection-icons.entity';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { routestCtr } from '../../configs/routes';
import { CollectionIconsService } from './collection-icons.service';
import { CollectionIconsGetResponse } from './dtos/icons.respone-sample.swagger';
@ApiTags('Collection-Icons')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.collectionIconsCtr.mainPath)
export class CollectionIconsController {
    constructor(
        private readonly collectionIconService: CollectionIconsService
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Get all collection icons',
        description:
            'Get all collection icons',
    })
    @ApiResponse(CollectionIconsGetResponse.RES_200)
    @HttpCode(HttpStatus.OK)
    async index(
        @Query(new GetAllValidationPipe({ entity: CollectionIcon }))
        filter: GetAllFilter4Shortcut<CollectionIcon>,
        @Req() req,
    ) {
        const dataRespond = await this.collectionIconService
            .getAllIcons(filter, req as IReq);
        return dataRespond;
    }
}