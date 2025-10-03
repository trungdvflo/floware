import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, ValidateNested } from 'class-validator';

export class MemberChannelDTO {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  channel_id: number;
}

export class MemberChannelDTOs {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MemberChannelDTO)
  @Expose()
  data: MemberChannelDTO;
  errors: any[];
}
