import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class DeleteDevicetokenDTO {
  @IsString()
  @ApiProperty({
    example: '4a56918ae4d86fa8c8511bd8681b802b'
  })
  @Expose()
  device_token: string;

  constructor(partial?: Partial<DeleteDevicetokenDTO>) {
    Object.assign(this, partial);
  }
}

export class DeleteDevicetokenDTOs {
  @IsNotEmpty()
  @ApiProperty({
    type: DeleteDevicetokenDTO
  })

  @Type(() => DeleteDevicetokenDTO)
  @ValidateNested()
  @Expose()
  data: DeleteDevicetokenDTO;

  errors: any[];
}