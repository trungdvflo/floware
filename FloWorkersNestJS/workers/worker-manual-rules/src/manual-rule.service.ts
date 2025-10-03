import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IManualRule } from '../common/interfaces/manual-rule.interface';
@Injectable()
export class ManualRuleService {
  constructor(
    private readonly httpClient: HttpService,
    private readonly configService: ConfigService
  ) { }

  async executeRule(dataJob: IManualRule): Promise<void> {
    try {
      const { baseV41Url } = this.configService.get('worker');
      const manualRuleUrl = `${baseV41Url}/manual-rules/executes`;
      const rs = await this.httpClient.post(manualRuleUrl, {
        data: [dataJob]
      }, {
        headers: {
          Accept: 'application/json',
        },
      }).toPromise();
      return rs.data;
    } catch (error) {
      return error;
    }
  }
}