import {
    CallHandler, ExecutionContext, HttpException,
    HttpStatus, Injectable, NestInterceptor
} from '@nestjs/common';
import { routestCtr } from '../../configs/routes';
import { APP_IDS } from '../constants';
import { ErrorCode } from '../constants/error-code';
import { MSG_APPREG_INVALID } from '../constants/message.constant';

export const WEB_ONLY_ROUTES: string[] = [
    routestCtr.apiLastModifiedCtr.mainPath
];

export const WEB_ONLY_METHOD: string[] = ['PUT'];

@Injectable()
export class WebOnly<T> implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const req = context.switchToHttp().getRequest();
        if (req.user.appId !== APP_IDS.web
            && WEB_ONLY_METHOD.includes(req.method)
            && WEB_ONLY_ROUTES.includes(req.path.substring(1))) {
            throw new HttpException({
                code: ErrorCode.INVALID_APP_UID,
                message: MSG_APPREG_INVALID
            }, HttpStatus.BAD_REQUEST);
        }
        return next.handle();
    }
}