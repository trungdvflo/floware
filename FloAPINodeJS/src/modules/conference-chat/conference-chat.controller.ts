import {
  BadRequestException,
  Body,
  Controller, Get, HttpCode, HttpStatus, Post,
  Put,
  Query,
  Req,
  Res, UploadedFile, UseFilters, UseInterceptors, UsePipes
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { routestCtr } from '../../configs/routes';
import uploadConfig from '../../configs/upload.config';
// import { routestCtr } from '../../apps/upload-download/routes'; // change pod
import { FileInterceptor } from '@nestjs/platform-express';
import { CONTENT_TYPE } from '../../common/constants/content-type.constant';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_UPLOAD } from '../../common/constants/message.constant';
import { SetRequestTimeout } from '../../common/decorators/request-timeout.decorator';
import { ConferenceChatEntity } from '../../common/entities/conference-chat.entity';
import { ChattingValidationPipe } from '../../common/filters/chatting-validation.pipe';
import { UnkownExceptionsFilter } from '../../common/filters/unkown-exceptions.filter';
import { BadRequestValidationFilter, BaseBadRequestValidationFilter, UnknownExceptionFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import {
  IDataRespond,
  MultipleRespond,
  ResponseMutiData,
  buildFailItemResponse
} from '../../common/utils/respond';
import { FileUploadUtil, multerOptions } from '../../common/utils/upload.util';
import { GetConferencePaging } from '../conference-channel/dtos';
import { MemberUpdateResponse } from '../conference-channel/dtos/channel.respone-sample.swagger';
import { ConferenceChatService } from './conference-chat.service';
import { ListMessageIntDTO } from './dtos/chatting-int-message.post.dto';
import { DeleteMessageIntDTO, DeleteMessageIntDTOs } from './dtos/chatting-int.delete.dto';
import {
  EditMessageIntDTO, EditMessageIntDTOs,
  UpdateConferenceChatDTO, UpdateConferenceChatDTOs
} from './dtos/conference-chat.put.dto';
import { LinkFileDTO, LinkFileDTOs } from './dtos/createLinkFile.dto';
import { DeleteFileDTO, DeleteFileSwagger } from './dtos/delete.dto';
import { GetDownloadDto } from './dtos/download.get.dto';
import { CreateFileDTO } from './dtos/upload.create.dto';

@ApiTags('Comment Attachment')
@Controller(routestCtr.conferenceChatCtr.mainPath)
export class ConferenceChatController {
  constructor(private readonly service: ConferenceChatService) { }

  @UsePipes(new BatchValidationPipe())
  @Get(routestCtr.conferenceChatCtr.messagePath)
  async ListChannelMessages(@Query() data: ListMessageIntDTO, @Req() req) {
    const result = await this.service.getListMessagesChannel(data, req as IReq);
    if (result?.error) {
      throw new BadRequestException(result?.error);
    }
    return result;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all conference chat',
    description:
      'Get all conference of this user',
  })
  @HttpCode(HttpStatus.OK)
  async index(
    @Query(new GetAllValidationPipe({ entity: ConferenceChatEntity }))
    filter: GetConferencePaging<ConferenceChatEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.service.getAllItems(filter, req as IReq);
    return dataRespond;
  }
  // @UseInterceptors(HttpResponseCodeInterceptor)
  // @UseFilters(BaseBadRequestValidationFilter)
  // @UseInterceptors(HttpSingleResponseCodeInterceptor)
  // @UseFilters(UnkownExceptionsFilter)
  @Get(routestCtr.conferenceChatCtr.downloadPath)
  @ApiOperation({
    summary: 'Download the update file',
    description: 'Download the update file',
  })
  @SetRequestTimeout(uploadConfig().requestTimeOut)
  @UsePipes(new BatchValidationPipe())
  async download(@Query() getQuery: GetDownloadDto, @Res() res: Response, @Req() req) {
    try {
      const download = await this.service.download(getQuery, req as IReq);
      if (download.wsa && download.wsa.Body) {
        const dlRes: AWS.S3.GetObjectOutput = download.wsa;
        const contentType = dlRes.ContentType ? dlRes.ContentType.toLowerCase() : 'unkown';
        res.set({
          'Content-Disposition': 'attachment; filename="' + download.sourceName + '"',
          'Content-Type': CONTENT_TYPE[contentType] || contentType,
          'Content-Length': (dlRes.Body as Buffer).length,
        });
        return download.stream.pipe(res);
      } else if (download.code === ErrorCode.REQUEST_SUCCESS) {
        // download redirect from S3
        res.redirect(download.url);
      } else {
        res.status(400).send({ error: download });
      }
    } catch (err) {
      throw err;
    }
  }

  @Post(routestCtr.conferenceChatCtr.uploadPath)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @UseInterceptors(HttpResponseCodeInterceptor)
  @UseFilters(BaseBadRequestValidationFilter)
  @UseFilters(UnkownExceptionsFilter)
  @SetRequestTimeout(uploadConfig().requestTimeOut)
  @ApiBody({ type: CreateFileDTO })
  async uploadedFile(
    @Body(new ChattingValidationPipe()) postData: CreateFileDTO,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      if (req.uploadError && req.uploadError.error) {
        throw new BadRequestException(
          buildFailItemResponse(ErrorCode.BAD_REQUEST, req.uploadError.msg));
      }
      if (!file) {
        throw new BadRequestException(
          buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_UPLOAD));
      }
      const ext = FileUploadUtil.getFileTypeFromFileName(file.originalname);
      const validateDTO: CreateFileDTO = Object.assign(new CreateFileDTO(), postData);
      const data = await this.service.fileSingleUpload(validateDTO, file, ext, req as IReq);
      res.send({ data });
    } catch (err) {
      throw err;
    }
  }

  @Post()
  @UseFilters(BadRequestValidationFilter)
  @UseFilters(UnknownExceptionFilter)
  @UseInterceptors(HttpResponseCodeInterceptor)
  async create(
    @Body(new BatchValidationPipe({ items: LinkFileDTO, key: 'data' }))
    body: LinkFileDTOs, @Req() req) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.service.createConferenceChat(data, req as IReq);
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

  @UseInterceptors(HttpResponseCodeInterceptor)
  @UseFilters(BaseBadRequestValidationFilter)
  @UseFilters(UnkownExceptionsFilter)
  @Put()
  @ApiResponse(MemberUpdateResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async updateConferenceChat(
    @Body(new BatchValidationPipe({ items: UpdateConferenceChatDTO, key: 'data' }))
    body: UpdateConferenceChatDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.service.update(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiBody({ type: DeleteFileSwagger })
  @UseInterceptors(HttpResponseCodeInterceptor)
  @UseFilters(BaseBadRequestValidationFilter)
  @Post(routestCtr.fileCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteFileDTO, key: 'data' }))
    body: DeleteFileSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.service.deleteConferenceChat(data, req as IReq);
    const { itemPass, itemFail } = result;
    return new ResponseMutiData(itemPass, [...errors, ...itemFail]);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @UseFilters(BaseBadRequestValidationFilter)
  @UseFilters(UnkownExceptionsFilter)
  @Put(routestCtr.conferenceChatCtr.messagePath)
  @ApiResponse(MemberUpdateResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async updateMessageChat(
    @Body(new BatchValidationPipe({ items: EditMessageIntDTO, key: 'data' }))
    body: EditMessageIntDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.service.updateMessage(data, req as IReq);
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
  @UseFilters(BaseBadRequestValidationFilter)
  @UseFilters(UnkownExceptionsFilter)
  @Post(routestCtr.conferenceChatCtr.messageDeletePath)
  @ApiResponse(MemberUpdateResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async deleteMessageChat(
    @Body(new BatchValidationPipe({ items: DeleteMessageIntDTO, key: 'data' }))
    body: DeleteMessageIntDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.service.deleteMessage(data, req as IReq);
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
