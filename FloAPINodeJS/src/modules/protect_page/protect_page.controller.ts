import {
    Body,
    Controller, Post, Req,
    UseFilters,
    UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpSingleResponseCodeInterceptor } from '../../common/interceptors/http-response-code-single-response.interceptor';
import { SingleValidationPipe } from '../../common/pipes/validation.pipe';
import { SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { VerifyPwdSwagger } from './dtos/verify_pwd.dto';
import { ProtectPageService } from './protect_page.service';

@ApiTags('ProtectPage')
@UseFilters(BaseBadRequestValidationFilter)
@UseInterceptors(HttpSingleResponseCodeInterceptor)
@Controller(routestCtr.protectPageCtr.mainPath)
export class ProtectPageController {
    constructor(
        private readonly protectPageService: ProtectPageService
    ) { }

    @ApiOperation({
        summary: 'Verify protect password',
        description:
            'Verify protect password',
    })
    @ApiBody({ type: VerifyPwdSwagger })
    @Post()
    async create(
        @Body(new SingleValidationPipe({ items: VerifyPwdSwagger, key: 'data' }))
        body: VerifyPwdSwagger,
        @Req() req,
    ) {
        const resData = await this.protectPageService.verify(body.data);
        return new SingleRespond(resData).singleData();
    }
}