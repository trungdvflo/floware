import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { fakeReq } from '../../../../test';
import { ClientReportErrorService } from '../client-report-error.service';

jest.mock('@slack/web-api', () => ({
  LogLevel: jest.fn(),
  WebClient: jest.fn(() => ({
    chat: {
      postMessage: jest.fn().mockResolvedValue(true)
    }
  }))
}))

describe('ClientReportErrorService', () => {
  let app: INestApplication;
  let clientReportErrorService: ClientReportErrorService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule
      ],
      providers: [
        ClientReportErrorService
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    clientReportErrorService = module.get<ClientReportErrorService>(ClientReportErrorService);
  });


  describe("can send error to slack", () => {
    it("Send error to slack success", async () => {
      const rs = await clientReportErrorService.sendReportErrorWebsocket({
        error_code: 'error_xxx',
        error_message: 'error_message_xxx',
        retries: 5
      }, fakeReq);
      expect(rs)
        .toEqual(true);
    });
  });

  describe("can't send error to slack", () => {
    it("Send error to slack success", async () => {
      clientReportErrorService.sendToSlack = jest.fn().mockRejectedValue(new Error('error'));
      try {
        await clientReportErrorService.sendReportErrorWebsocket({
          error_code: 'error_xxx',
          error_message: 'error_message_xxx',
          retries: 5
        }, fakeReq);

      } catch (e) {
        expect(e.message)
          .not.toBeNull();
      }
    });
  });
  afterAll(async () => {
    await app.close();
  });
});
