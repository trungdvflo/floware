import {
  Body,
  Controller,

  HttpCode,
  HttpStatus,
  Post,

  Req,
  UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe } from '../../common/pipes/validation.pipe';
import { ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { TrashCreateDtos, TrashMemberCreateDto } from './dtos/trash-member.create.dto';
import {
  TrashCreateReponse
} from './dtos/trash.respone-sample.swagger';
import { TrashMemberService } from './trash-member.service';
@ApiTags('Trash Collections')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.trashMemberCtr.mainPath)
export class TrashMemberController {
  constructor(
    private readonly trashService: TrashMemberService,
  ) {}

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
    @Body(new BatchValidationPipe({ items: TrashMemberCreateDto, key: 'data' }))
    body: TrashCreateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.trashService.saveBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }
}
