import { Controller, Post, Req } from '@nestjs/common';
import { RequestBody } from 'common/decorators/request-body.decorator';
import { buildSingleResponseErr } from 'common/utils/respond';
import { routestCtr } from 'configs/routes.config';
import { CallingPushDTO } from './dtos/calling.post.dto';
import { CancelPushDTO } from './dtos/cancel.post.dto';
import { PushDeviceService } from './push-device.service';

@Controller(routestCtr.apnPushCtr.mainPath)
export class PushDeviceController {
  constructor(private readonly pushDeviceService: PushDeviceService) {}
  @Post(routestCtr.apnPushCtr.cancelPath)
  async apnCancel(@RequestBody(CancelPushDTO) data) {
    if (data.statusCode === 400) {
      const errRespond = buildSingleResponseErr(data.statusCode, data.message);
      return errRespond;
    }
    return this.pushDeviceService.pushCancelInvitees(data['attributes']);
  }

  @Post(routestCtr.apnPushCtr.callingPath)
  async apnCalling(@RequestBody(CallingPushDTO) data) {
    if (data.statusCode === 400) {
      const errRespond = buildSingleResponseErr(data.statusCode, data.message);
      return errRespond;
    }
    return this.pushDeviceService.pushCallingInvitees(data['attributes']);
  }
}
