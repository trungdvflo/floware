import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { maxFile } from '../../common/constants';
import { CONTENT_TYPE } from '../../common/constants/content-type.constant';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_FILE_EMPTY } from '../../common/constants/message.constant';
import { SetRequestTimeout } from '../../common/decorators/request-timeout.decorator';
import { ChattingValidationPipe } from '../../common/filters/chatting-validation.pipe';
import { UnkownExceptionsFilter } from '../../common/filters/unkown-exceptions.filter';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor, HttpSingleResponseCodeInterceptor } from '../../common/interceptors';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import {
  IDataRespond, MultipleRespond,
  ResponseMutiData, SingleRespond, buildFailItemResponse
} from '../../common/utils/respond';
import { multerOptions } from '../../common/utils/upload.util';
import { routestCtr } from '../../configs/routes';
import uploadConfig from '../../configs/upload.config';
import { ChatService } from './chat-realtime.service';
import {
  DeleteChatDTO, DeleteChatDTOs, GetAttachmentDTO, GetChatDTO,
  GetLastSeenDTO,
  PostChatDTO, PostChatDTOs, PutChatDTO,
  PutChatDTOs, PutLastSeenDTO, PutLastSeenDTOs
} from './dtos';
import {
  ChatCreateResponse, ChatGetResponse
} from './dtos/chat.respone-sample.swagger';
import { ChatDownloadDTO } from './dtos/download.dto';
import { ChimeFileDTO } from './dtos/upload.dto';

@ApiTags('Chat real-time')
@Controller(routestCtr.chatCtr.main)
export class ChatController {
  constructor(
    private readonly chatMessageService: ChatService
  ) { }

  @Get(routestCtr.chatCtr.message)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Get all chat message',
    description: 'Get all chat message of the channel',
  })
  @ApiResponse(ChatGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  getChannelMessage(
    @Query(new GetAllValidationPipe({ entity: Object }))
    query: GetChatDTO,
    @Req() req) {
    return this.chatMessageService.getChannelChatMessage(query, req as IReq);
  }

  @Get(routestCtr.chatCtr.getAttachment)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Get all chat attachments message',
    description: 'Get all chat attachments message of the channel',
  })
  @ApiResponse(ChatGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  getListAttachments(
    @Query(new GetAllValidationPipe({ entity: Object }))
    query: GetAttachmentDTO,
    @Req() req
  ) {
    return this.chatMessageService.getListChatAttachments(query, req as IReq);
  }

  @Get(routestCtr.chatCtr.lastSeen)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Get all chat attachments message',
    description: 'Get all chat attachments message of the channel',
  })
  @ApiResponse(ChatGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  getListLastSeen(
    @Query(new GetAllValidationPipe({ entity: Object }))
    query: GetLastSeenDTO,
    @Req() req
  ) {
    return this.chatMessageService.getLastSeenMessages(query, req as IReq);
  }

  @Post(routestCtr.chatCtr.message)
  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Create chat message',
    description: 'Create chat message',
  })
  @ApiResponse(ChatCreateResponse.RES_200)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Body(new BatchValidationPipe({ items: PostChatDTO, key: 'data', typeObj: 0 }))
    body: PostChatDTOs,
    @Req() req,
  ) {
    const { data } = body;
    const rs = await this.chatMessageService
      .sendChatMessage(data, req as IReq);
    return new SingleRespond(rs).singleData();
  }

  @Put(routestCtr.chatCtr.message)
  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Update list of comments',
    description: 'Update list of comments',
  })
  @ApiResponse(ChatGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async updateMessage(
    @Body(new BatchValidationPipe({ items: PutChatDTO, key: 'data', typeObj: 0 }))
    body: PutChatDTOs,
    @Req() req) {
    const { data } = body;
    const rs = await this.chatMessageService
      .updateChatMessage(data, req as IReq);
    return new SingleRespond(rs).singleData();
  }

  @Put(routestCtr.chatCtr.lastSeen)
  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Update last seen status for channel',
    description: 'Update last seen status for channel',
  })
  @ApiResponse(ChatGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async updateLastSeen(
    @Body(new BatchValidationPipe({ items: PutLastSeenDTO, key: 'data', typeObj: 0 }))
    body: PutLastSeenDTOs,
    @Req() req) {
    const { data } = body;
    const rs = await this.chatMessageService
      .updateLastChatSeen(data, req as IReq);
    return new SingleRespond(rs).singleData();
  }

  @Post(routestCtr.chatCtr.deleteChat)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Remove chat messages',
    description: 'Remove list of chat messages',
  })
  @ApiResponse(ChatGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Body(new BatchValidationPipe({ items: DeleteChatDTO, key: 'data' }))
    body: DeleteChatDTOs,
    @Req() req) {
    const { data, errors = [] } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.chatMessageService
      .deleteChatMessage(data, req as IReq);
    if (itemFail && itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @Post(routestCtr.chatCtr.upload)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', (maxFile + 1), multerOptions))
  @UseInterceptors(HttpResponseCodeInterceptor)
  @UseFilters(BaseBadRequestValidationFilter)
  @UseFilters(UnkownExceptionsFilter)
  @SetRequestTimeout(uploadConfig().requestTimeOut)
  async uploadedFile(
    @Body(new ChattingValidationPipe()) postData: ChimeFileDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      if (req.uploadError && req.uploadError.error) {
        throw new BadRequestException(
          buildFailItemResponse(ErrorCode.BAD_REQUEST, req.uploadError.msg));
      }
      if (files?.length === 0) {
        throw new BadRequestException(
          buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_FILE_EMPTY));
      }
      const validateDTO: ChimeFileDTO = Object.assign(new ChimeFileDTO(), postData);
      const { itemPass, itemFail } =
        await this.chatMessageService.fileSingleUpload(validateDTO, files, req as IReq);
      res.send(new ResponseMutiData(itemPass, itemFail));
    } catch (err) {
      throw err;
    }
  }

  @Get(routestCtr.chatCtr.download)
  @ApiOperation({
    summary: 'Download the update file',
    description: 'Download the update file',
  })
  @SetRequestTimeout(uploadConfig().requestTimeOut)
  @UsePipes(new BatchValidationPipe())
  async download(@Query() getQuery: ChatDownloadDTO, @Res() res: Response, @Req() req) {
    try {
      const download = await this.chatMessageService.download(getQuery, req as IReq);
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
}
