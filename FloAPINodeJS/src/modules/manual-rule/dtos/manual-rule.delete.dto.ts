import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { requestBodyDeleteManualRule } from '../../../common/swaggers/manual-rule.swagger';

export class DeleteManualRuleDTO {
  @IsInt()
  @Expose()
  id: number;
}

export class DeleteManualRuleSwagger {
  @IsNotEmpty()
  @ApiProperty({
    type: DeleteManualRuleDTO,
    example: [requestBodyDeleteManualRule]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteManualRuleDTO[];
  errors: DeleteManualRuleDTO[];
}