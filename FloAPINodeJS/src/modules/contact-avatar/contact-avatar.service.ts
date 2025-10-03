import { Injectable } from '@nestjs/common';
import { URL } from 'url';
import { ResponseCode } from '../../common/constants/response-code';
import { ObjectS3, S3Util, S3Utility } from '../../common/utils/s3.util';
import cfgAWS from '../../configs/aws';
import { ContactAvatarGetDTO } from './dto/contact-avatar-get.dto';
import { ContactAvatarResponseDTO } from './dto/contact-avatar.response.dto';
@Injectable()
export class ContactAvatarService {
    s3Util: S3Utility;
    constructor() {
        this.s3Util = S3Util({
            endpoint: cfgAWS().s3Endpoint,
            region: cfgAWS().s3Region,
            accessKeyId: cfgAWS().s3AccessKeyId,
            secretAccessKey: cfgAWS().s3SecretAccessKey,
        }, cfgAWS().s3Bucket || 'bucket_name');
    }
    async downloadContactAvatar(query: ContactAvatarGetDTO,
        davDomain: string = process.env.DAV_DOMAIN_NAME)
        : Promise<ContactAvatarResponseDTO> {
        const contactAvt: string = 'contact-avatar';
        const source: string = `${contactAvt}/${query.m}/${query.ad}/${query.u}/${query.u}.jpg`;
        const isExistFile: boolean = await this.s3Util.FileExist(source, cfgAWS().s3DavBucket);
        if (!isExistFile) {
            return {
                avatarUrl: '',
                code: ResponseCode.INVALID_DATA,
                error: {
                    message: 'Contact avatar image does not exist'
                }
            };
        }
        const download: ObjectS3 = await this.s3Util.DownloadUrl(source, 10, cfgAWS().s3DavBucket);
        if (download.code !== 1) {
            return {
                avatarUrl: '',
                code: ResponseCode.INVALID_DATA,
                error: {
                    message: 'Contact avatar image does not exist'
                }
            };
        }
        let replaceUrlParsed: URL | '';
        try {
            replaceUrlParsed = new URL(davDomain);
        } catch (e) {
            replaceUrlParsed = '';
        }
        if (!replaceUrlParsed) {
            return {
                avatarUrl: download.url,
                code: ResponseCode.FOUND
            };
        }
        const urlParsed: URL = new URL(download.url);
        const pathname: string = `${contactAvt}/${query.m}/${query.ad}/${encodeURIComponent(query.u)}/${encodeURIComponent(query.u)}.jpg`;
        urlParsed.protocol = replaceUrlParsed.protocol;
        urlParsed.host = replaceUrlParsed.host;
        urlParsed.port = replaceUrlParsed.port;
        urlParsed.pathname = pathname;
        return {
            avatarUrl: urlParsed.toString(),
            code: ResponseCode.FOUND
        };
    }
}