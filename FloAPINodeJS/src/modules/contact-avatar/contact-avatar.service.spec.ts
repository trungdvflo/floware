import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContactAvatarService } from './contact-avatar.service';
import { ContactAvatarGetDTO } from './dto/contact-avatar-get.dto';
import { ContactAvatarResponseDTO } from './dto/contact-avatar.response.dto';
const mS3Instance = {
    headObject: jest.fn().mockReturnThis(),
    getSignedUrl: jest.fn().mockReturnThis()
};
jest.mock('aws-sdk', () => {
    return { S3: jest.fn(() => mS3Instance) };
});

describe('ContactAvatarService', () => {
    let app: INestApplication;
    let contactAvatarService: ContactAvatarService;

    process.env.DAV_DOMAIN_NAME = 'https://static-dav.flodev.net';
    process.env.AWS_S3_ENDPOINT = 'https://s3.us-east-1.wasabisys.com';
    process.env.AWS_S3_DAV_BUCKET='static-dav.flodev.net';
    
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
            ],
            providers: [
                ContactAvatarService,
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
        contactAvatarService = module.get<ContactAvatarService>(ContactAvatarService);
    });

    it('should be defined', () => {
        expect(contactAvatarService).toBeDefined();
    });

    it('should return an error when supply fail param', async () => {
        mS3Instance.headObject = jest.fn().mockImplementation((param, callback) => callback('error'));
        mS3Instance.getSignedUrl = jest.fn().mockReturnValue(null);

        const error: ContactAvatarResponseDTO = {
            avatarUrl: '',
            code: 422,
            error: {
                message: 'Contact avatar image does not exist'
            }
        };

        const query: ContactAvatarGetDTO = { m: 'test', u: 'test', ad: 1, };
        const errorResult: ContactAvatarResponseDTO = await contactAvatarService.downloadContactAvatar(query);
        expect(errorResult).not.toBe(null);
        expect(errorResult.code).toEqual(error.code);
        expect(errorResult.avatarUrl).toEqual(error.avatarUrl);
        expect(errorResult.error).not.toBe(null);
        expect(errorResult.error).toEqual(error.error);
        jest.restoreAllMocks()
    });


    it('should return success s3 url', async () => {

        mS3Instance.headObject = jest.fn().mockImplementation(
            (param, callback) => callback(null, {
                AcceptRanges: 'bytes',
                LastModified: '2022-05-11T10:48:34.000Z',
                ContentLength: 18489,
                ETag: '"479fae6fb1cd96f697716b1191fa78f0"',
                ContentType: 'application/octet-stream',
                Metadata: {}
            })
        );
        mS3Instance.getSignedUrl = jest.fn().mockReturnValue("https://s3.us-east-1.wasabisys.com/static-dav.flodev.net/contact-avatar/248a0e49c72fd88bfc2645561a266e79/41736/9ce57e3d-b72d-4cfe-880c-ed5e74113102.vcf/9ce57e3d-b72d-4cfe-880c-ed5e74113102.vcf.jpg?AWSAccessKeyId=RTA5CTD40ERBZDAODUCB&Expires=1652412793&Signature=%2FqUPgh1hr9wZcAAgjpge45zug7o%3D");
        const success = {
            baseHost: process.env.AWS_S3_ENDPOINT,
            Signature: 'Signature',
            AWSAccessKeyId: 'AWSAccessKeyId',
            basePath: "contact-avatar",
            code: 302
        };
        const query: ContactAvatarGetDTO = {
            m: '248a0e49c72fd88bfc2645561a266e79',
            u: '9ce57e3d-b72d-4cfe-880c-ed5e74113102.vcf',
            ad: 41736
            //tm:1
        };
        const successResult: ContactAvatarResponseDTO = await contactAvatarService.downloadContactAvatar(query, '');
        expect(successResult).not.toBe(null);
        expect(successResult.code).toEqual(success.code);
        expect(successResult.error).toBeUndefined();
        expect(successResult.avatarUrl).toContain(success.baseHost);
        expect(successResult.avatarUrl).toContain(success.Signature);
        expect(successResult.avatarUrl).toContain(success.AWSAccessKeyId);
        expect(successResult.avatarUrl).toContain(success.basePath);
        jest.restoreAllMocks()
    });


    it('should return dav cnane link', async () => {
        mS3Instance.headObject = jest.fn().mockImplementation(
            (param, callback) => callback(null, {
                AcceptRanges: 'bytes',
                LastModified: '2022-05-11T10:48:34.000Z',
                ContentLength: 18489,
                ETag: '"479fae6fb1cd96f697716b1191fa78f0"',
                ContentType: 'application/octet-stream',
                Metadata: {}
            })
        );
        mS3Instance.getSignedUrl = jest.fn().mockReturnValue("https://s3.us-east-1.wasabisys.com/static-dav.flodev.net/contact-avatar/248a0e49c72fd88bfc2645561a266e79/41736/9ce57e3d-b72d-4cfe-880c-ed5e74113102.vcf/9ce57e3d-b72d-4cfe-880c-ed5e74113102.vcf.jpg?AWSAccessKeyId=RTA5CTD40ERBZDAODUCB&Expires=1652412793&Signature=%2FqUPgh1hr9wZcAAgjpge45zug7o%3D");
        const success = {
            baseHost: process.env.DAV_DOMAIN_NAME,
            Signature: 'Signature',
            AWSAccessKeyId: 'AWSAccessKeyId',
            basePath: "contact-avatar",
            code: 302
        };
        const query: ContactAvatarGetDTO = {
            m: '248a0e49c72fd88bfc2645561a266e79',
            u: '9ce57e3d-b72d-4cfe-880c-ed5e74113102.vcf',
            ad: 41736
            //tm:1
        };
        const successResult: ContactAvatarResponseDTO = await contactAvatarService.downloadContactAvatar(query);
        expect(successResult).not.toBe(null);
        expect(successResult.code).toEqual(success.code);
        expect(successResult.error).toBeUndefined();
        expect(successResult.avatarUrl).toContain(success.baseHost);
        expect(successResult.avatarUrl).toContain(success.Signature);
        expect(successResult.avatarUrl).toContain(success.AWSAccessKeyId);
        expect(successResult.avatarUrl).toContain(success.basePath);
        jest.restoreAllMocks()
    });



    afterAll(async () => {
        await app.close();
    });
});