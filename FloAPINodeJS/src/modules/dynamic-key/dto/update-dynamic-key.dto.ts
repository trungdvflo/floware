import { PartialType } from '@nestjs/swagger';
import { CreateDynamicKeyDto } from './create-dynamic-key.dto';

export class UpdateDynamicKeyDto extends PartialType(CreateDynamicKeyDto) {}
