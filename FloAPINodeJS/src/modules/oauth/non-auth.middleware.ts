import { HttpStatus, Injectable, NestMiddleware, UseFilters } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_APPREG_INVALID } from '../../common/constants/message.constant';
import { AppRegister } from '../../common/entities/app-register.entity';
import { BadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { IHeader } from '../../common/interfaces/header.interface';
import { logRequest } from '../../common/utils/common';
import { buildFailItemResponse, filterErrorMessage } from '../../common/utils/respond';
import { HeaderNonAuthDTO } from './dto/header-non-authorizarion';

// Keep source of Khoa Pham
@Injectable()
@UseFilters(new BadRequestValidationFilter())
export class HeadersNonAuthMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(AppRegister)
    private readonly appRegister: Repository<AppRegister>
  ) { }

  // tslint:disable-next-line: ban-types
  async use(req: Request, res: Response, next: Function) {
    try {
      // tslint:disable-next-line: new-parens
      const validateDTO: HeaderNonAuthDTO = Object.assign(new HeaderNonAuthDTO, req.headers);
      const errors = await validate(validateDTO);
      if (errors.length > 0) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          buildFailItemResponse(ErrorCode.BAD_REQUEST, filterErrorMessage(errors))
        );
      }
      const { app_id, device_uid, user_agent } = validateDTO;
      const appRegister = await this.appRegister.findOne({
        where: {
          app_reg_id: app_id
        }
      });
      if (!appRegister) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_APPREG_INVALID)
        );
      }
      const headerInfo: IHeader = {
        appId: app_id,
        deviceUid: device_uid,
        userAgent: user_agent || null,
      };
      req['header'] = headerInfo;
      logRequest(req);

      next();
    } catch (e) {
      next(e); // if (e instanceof HttpException)
    }
  }
}