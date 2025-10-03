import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { RequestParam } from '../../../common/swaggers/call-history.swagger';
export class DeleteCallingHistoryDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.room_id)
  @Expose()
  room_id: string;
}

export class DeleteCallingHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteCallingHistoryDTO,
    example: [
      {
        'room_id': "49294893bdj989384"
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteCallingHistoryDTO[];
  errors: DeleteCallingHistoryDTO[];
}