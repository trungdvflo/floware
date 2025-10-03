import {
  BadRequestException,
  Body, Controller, ForbiddenException, Get, Injectable,
  Post,
  Put, Req, Res,
  UnauthorizedException,
  UseFilters,
  UsePipes
} from '@nestjs/common';
import { ApiHeaders, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_NOT_FOUND_USER, MSG_TOKEN_INVALID } from '../../common/constants/message.constant';
import { Users } from '../../common/entities/users.entity';
import {
  BaseBadRequestValidationFilter,
  BaseNotFoundValidationFilter,
  UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { IReq } from '../../common/interfaces';
import { UserValidationPipe } from '../../common/pipes/user-validation.pipe';
import { ApiHeaderSchema } from '../../common/swaggers/common.swagger';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { SingleRespond, buildSingleResponseErr } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ReqUpdateUserProfileDto } from './dtos/req.dto';
import { UserDto } from './dtos/users.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller(routestCtr.userCtr.mainPath)
@UseFilters(BaseBadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@UseFilters(BaseNotFoundValidationFilter)
@Injectable()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @ApiHeaders(ApiHeaderSchema)
  @Post(routestCtr.userCtr.signInPath)
  async LoginSwagger(@Body() postData: UserDto, @Req() req, @Res() res: Response) {
    if (process.env.SWAGGER_UI_ENABLED.toLowerCase() !== 'true') {
      throw new ForbiddenException();
    }
    const { app_id, device_uid } = req.headers;
    const data = {
      username: postData.username,
      grant_type: 'password',
      ip: process.env.SWAGGER_IP || '',
      password: CryptoUtil.encryptPassWithPublicKey(postData.password)
    };
    const result = await this.service.getToken(data, app_id, device_uid);

    if (result?.data) {
      res.cookie('swagger-info', {
        app_id,
        device_uid,
        authorization: result.data['access_token']
      });
      return res.send(result);
    } else {
      res.clearCookie('swagger-info');
      throw new UnauthorizedException({ message: MSG_TOKEN_INVALID });
    }
  }

  @ApiOperation({
    summary: 'Update user profile by user id',
    description: 'Update user profile by user id',
  })
  @Put(routestCtr.userCtr.profilePath)
  @UsePipes(new UserValidationPipe())
  async updateUserProfile(
    @Body() body: ReqUpdateUserProfileDto,
    @Req() req,
    @Res() res: Response,
  ): Promise<object> {
    const user: Users = Object.assign(body.data, new Users());
    const result = await this.service.updateUserProfile(user, req as IReq);
    if (!result) {
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.USER_NOT_FOUND, MSG_NOT_FOUND_USER),
      );
    }
    return res.json(new SingleRespond({ data: result }).singleData());
  }

  @ApiOperation({
    summary: 'Get user profile by user id',
    description: 'Get user profile by user id',
  })
  @Get(routestCtr.userCtr.profilePath)
  async getProfileByUserId(@Req() req, @Res() res: Response): Promise<object> {
    const result: any = await this.service.getUserProfileById(req.user.userId);
    if (!result) {
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.USER_NOT_FOUND, MSG_NOT_FOUND_USER),
      );
    }
    return res.json(new SingleRespond({ data: result }).singleData());
  }

  @ApiOperation({
    summary: 'terminal account',
    description: 'Create request to terminal account',
  })
  @Post(routestCtr.userCtr.terminate)
  async terminateAcc(@Req() req): Promise<object> {
    const result: any = await this.service.terminateAcc(req.user);
    if (!result) {
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.USER_NOT_FOUND, MSG_NOT_FOUND_USER),
      );
    }
    return new SingleRespond({ data: result }).singleData();
  }
}