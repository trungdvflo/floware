import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { CredentialEntity } from '../../common/entities/credential.entity';
import { BadRequestValidationFilter, UnknownExceptionFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CredentialService } from './credential.service';
import { CredentialDeleteDTO, CredentialDeleteSwagger } from './dto/credential.delete.dto';
import { CredentialDTO, CredentialSwagger } from './dto/credential.post.dto';
import { CredentialUpdateDTO, CredentialUpdateSwagger } from './dto/credential.put.dto';

@UseFilters(BadRequestValidationFilter)
@UseInterceptors(HttpResponseCodeInterceptor)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.credentialCtr.mainPath)
@ApiTags('credential')
export class CredentialController {
  constructor(
    private readonly credentialService: CredentialService,
  ) { }

  @Get(routestCtr.credentialCtr.saltPath)
  async handleSalt(@Req() req) {
    const resData = await this.credentialService.getSalt(req.user);
    return resData;
  }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: CredentialEntity }))
    filter: GetAllFilter<CredentialEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.credentialService.getAllFiles(
      filter,
      req
    );
    return dataRespond;
  }

  @Post()
  async create(
    @Body(new BatchValidationPipe({ items: CredentialDTO, key: 'data' }))
    body: CredentialSwagger, @Req() req) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.credentialService.createCredential(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @Put()
  async update(
    @Body(new BatchValidationPipe({ items: CredentialUpdateDTO, key: 'data' }))
    body: CredentialUpdateSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } =
      await this.credentialService.updateCredential(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Post(routestCtr.credentialCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: CredentialDeleteDTO, key: 'data' }))
    body: CredentialDeleteSwagger, @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.credentialService.deleteCredentials(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }
}
