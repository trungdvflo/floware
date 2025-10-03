import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt,
  IsNotEmpty, IsPositive, ValidateNested
} from 'class-validator';
import { RequestParam } from '../../../common/swaggers/conference-history.swagger';

export class DeleteConferenceHistoryDTO {

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}

export class DeleteConferenceHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [DeleteConferenceHistoryDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteConferenceHistoryDTO[];
  errors: any[];
}