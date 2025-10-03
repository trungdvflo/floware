import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes, ApiTags
} from '@nestjs/swagger';
import { validate } from 'class-validator';
import { ValidationError } from 'class-validator/types/validation/ValidationError';
import { Response } from 'express';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_FILE_EMPTY } from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { FileAttachment } from '../../common/entities/file-attachment.entity';
import { FileValidationPipe } from '../../common/filters/file-validation.pipe';
import {
  BaseBadRequestValidationFilter,
  UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import {
  DataRespond,
  MultipleRespond,
  SingleRespond,
  buildFailItemResponse,
  filterErrorMessage
} from '../../common/utils/respond';
import { FileUploadUtil, multerOptions } from '../../common/utils/upload.util';
import { routestCtr } from '../../configs/routes';
import { CreateFileDTO } from './dtos/file-attachment.dto';
import { DeleteFileDTO, DeleteFileSwagger } from './dtos/file-delete.dto';
import { FileDownloadDTO } from './dtos/file-download.dto';
import { FileService } from './file-attachment.service';

@UseInterceptors(HttpResponseCodeInterceptor)
@UseFilters(BaseBadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.fileCtr.mainPath)
@ApiTags('File Attachment')
export class FileController {
  constructor(private readonly fileService: FileService) { }
  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: FileAttachment }))
    filter: GetAllFilter<FileAttachment>,
    @Req() req,
  ) {
    const dataRespond = await this.fileService.getAllFiles(filter, req.user.userId);
    return dataRespond;
  }

  @Get(routestCtr.fileCtr.downloadPath)
  @UsePipes(new BatchValidationPipe())
  async download(@Query() reqParam: FileDownloadDTO, @Res() res: Response, @Req() req) {
    const { stream, resContent } = await this.fileService.downloadSingleFile(
      reqParam,
      req
    );
    res.set(resContent);
    return stream.pipe(res);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiBody({ type: CreateFileDTO })
  async uploadedFile(
    @Body(new FileValidationPipe()) postData: CreateFileDTO,
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: Response,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException(buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_FILE_EMPTY));
    }
    const ext = FileUploadUtil.getFileTypeFromFileName(file.originalname);
    if (!ext || (ext && ext.length === 0)) {
      throw new BadRequestException(
        buildFailItemResponse(ErrorCode.BAD_REQUEST, `${file.originalname} is not allowed!`),
      );
    }
    if (!FileUploadUtil.isValidFileType(ext)) {
      throw new BadRequestException(
        buildFailItemResponse(ErrorCode.BAD_REQUEST, `${file.originalname} is not allowed!`),
      );
    }
    const validateDTO: CreateFileDTO = Object.assign(new CreateFileDTO(), postData);
    const result: ValidationError[] = await validate(validateDTO);
    if (result.length > 0) {
      throw new BadRequestException(
        buildFailItemResponse(ErrorCode.BAD_REQUEST, filterErrorMessage(result), {
          [result[0].property]: result[0].value,
        }),
      );
    }
    const data = await this.fileService
      .fileSingleUpload(validateDTO, file, ext, req as IReq);
    return res.json(new SingleRespond({ data }).singleData());
  }

  @ApiBody({ type: DeleteFileSwagger })
  @Post(routestCtr.fileCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteFileDTO, key: 'data' }))
    body: DataRespond,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      // tslint:disable-next-line: no-shadowed-variable
      const dataRespond: any = { errors };
      return new MultipleRespond(dataRespond).multipleRespond();
    }

    const result = await this.fileService.deleteFile(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: any = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }
}
