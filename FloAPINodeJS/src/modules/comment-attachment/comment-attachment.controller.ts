import {
  BadRequestException,
  Body,
  Controller, Get, Post,
  Query,
  Req,
  Res, UploadedFile, UseFilters, UseInterceptors, UsePipes
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as AWS from 'aws-sdk';
import { Response } from 'express';
import { routestCtr } from '../../configs/routes';
import uploadConfig from '../../configs/upload.config';
// import { routestCtr } from '../../apps/upload-download/routes'; // change pod
import { FileInterceptor } from '@nestjs/platform-express';
import { CONTENT_TYPE } from '../../common/constants/content-type.constant';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_ERR_UPLOAD } from '../../common/constants/message.constant';
import { SetRequestTimeout } from '../../common/decorators/request-timeout.decorator';
import { FileValidationPipe } from '../../common/filters/file-validation.pipe';
import { UnkownExceptionsFilter } from '../../common/filters/unkown-exceptions.filter';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe } from '../../common/pipes/validation.pipe';
import {
  buildFailItemResponse,
  ResponseMutiData
} from '../../common/utils/respond';
import { FileUploadUtil, multerOptions } from '../../common/utils/upload.util';
import { CommentAttachmentService } from './comment-attachment.service';
import { DeleteFileDTO, DeleteFileSwagger } from './dtos/delete.dto';
import { GetDownloadDto } from './dtos/download.get.dto';
import { CreateFileDTO } from './dtos/upload.create.dto';

@ApiTags('Comment Attachment')
@UseInterceptors(HttpResponseCodeInterceptor)
@UseFilters(BaseBadRequestValidationFilter)
@UseFilters(UnkownExceptionsFilter)
@Controller(routestCtr.fileCommentCtr.mainPath)
export class CommentAttachmentController {
  constructor(private readonly service: CommentAttachmentService) { }

  @Get(routestCtr.fileCommentCtr.downloadPath)
  @ApiOperation({
    summary: 'Download the update file',
    description: 'Download the update file',
  })
  @SetRequestTimeout(uploadConfig().requestTimeOut)
  @UsePipes(new BatchValidationPipe())
  async download(
    @Query() getQuery: GetDownloadDto,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const download = await this.service.download(getQuery, req.user);
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

  @Post(routestCtr.fileCommentCtr.uploadPath)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @UsePipes(new BatchValidationPipe())
  @SetRequestTimeout(uploadConfig().requestTimeOut)
  @ApiBody({ type: CreateFileDTO })
  async uploadedFile(
    @Body(new FileValidationPipe()) postData: CreateFileDTO,
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

  @ApiBody({ type: DeleteFileSwagger })
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

    const result = await this.service.deleteFile(data, req as IReq);
    const { itemPass, itemFail } = result;
    return new ResponseMutiData(itemPass, [...errors, ...itemFail]);
  }
}
