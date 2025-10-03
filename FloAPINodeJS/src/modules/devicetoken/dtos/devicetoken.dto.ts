import { ApiResponseProperty, PartialType } from '@nestjs/swagger';
import { Devicetoken } from '../../../common/entities/devicetoken.entity';

export class DevicetokenResponse extends PartialType(Devicetoken) {
}

export class DevicetokenDeleteResponse {
  @ApiResponseProperty({ example: '7a119182b4d86te8c8522bd8681b762b' })
  device_token: string;
}