import { Controller, Get, Query, Res, UseInterceptors } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiHeaders,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from '@nestjs/swagger';
import { Response } from 'express';
import { ResponseCode } from '../../common/constants/response-code';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { ResponseMappingInterceptor } from '../../common/interceptors';
import { ApiHeaderSchema } from '../../common/swaggers/common.swagger';
import { routestCtr } from '../../configs/routes';
import { ContactAvatarService } from './contact-avatar.service';
import { ContactAvatarGetDTO } from './dto/contact-avatar-get.dto';

@UseInterceptors(ResponseMappingInterceptor)
@ApiTags('contact avatar')
@Controller(routestCtr.contactAvatarCtr.mainPath)

export class ContactAvatarController {
    constructor(private readonly contactAvatarService: ContactAvatarService) { }

    @Get()
    @ApiBearerAuth()
    @ApiHeaders(ApiHeaderSchema)
    @ApiOkResponse({
        description: 'Upload and download avatar of the contact.',
        type: String,
    })
    @ApiOperation({
        summary: 'Contact avatar',
        description: 'Upload and download avatar of the contact.',
    })
    @ApiBadRequestResponse({ type: ValidationException })
    public async Download(
        @Query()
        query: ContactAvatarGetDTO,
        @Res() res: Response
    ): Promise<any> {
        try {
            const avatar = await this.contactAvatarService.downloadContactAvatar(query);
            if (avatar.error) {
                return res.status(ResponseCode.INVALID_DATA)
                    .json(avatar);
            }
            return res.redirect(avatar.avatarUrl);
        } catch (error) {
            throw error;
        }
    }
}