import { Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateChannelDTO {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  channel_id: number;
}

export class CreateChannelDTOs {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateChannelDTO)
  @Expose()
  data: CreateChannelDTO;
  errors: any[];
}

export class WSSMemberDTO {
  @Expose()
  @IsInt()
  @Transform(({ value }) => +value)
  @IsNotEmpty()
  channel_id: number;
}

export class MessageDTO {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  channel_id: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  msg: string;
}
export class MessageDTOs {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageDTO)
  @Expose()
  data: MessageDTO;
  errors: any[];
}
