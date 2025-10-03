import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MSG_ERR_SERVER_ERROR } from '../../common/constants/message.constant';
import floConfig from '../../configs/flo';
import { routestCtr } from '../../configs/routes';
import { MonitorService } from './monitor.service';

@Controller(routestCtr.monitorCtr.mainPath)
@ApiTags('Monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}
  @Get()
  @ApiOperation({
    summary: 'Service status monitor',
  })
  async index() {
    const NS_PER_SEC = 1e9;
    const time = process.hrtime();
    await this.monitorService.getUser();
    const diff = process.hrtime(time);
    const execTime = diff[0] * NS_PER_SEC + diff[1]; // nanoseconds
    const timeout = floConfig().serviceHealthCheck * 1000000; // milliseconds to nanoseconds
    if (execTime > timeout) {
      throw new HttpException(MSG_ERR_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return null;
  }
}
