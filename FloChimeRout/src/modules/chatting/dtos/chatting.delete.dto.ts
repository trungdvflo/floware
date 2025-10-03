import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  ValidateNested
} from 'class-validator';
export class DeleteChannelDTO {
  @IsInt()
  @IsNotEmpty()
  @Expose()
  id: number;
}

export class DeleteChannelDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteChannelDTO[];
  errors: DeleteChannelDTO[];
}

class MemberParam {
  @IsNotEmpty()
  @IsDefined()
  @IsEmail()
  @Expose()
  email: string;
}

export class RemoveMembersDTO {
  @IsInt()
  @IsNotEmpty()
  @Expose()
  channel_id: number;

  // @IsString()
  // @IsNotEmpty()
  // @Expose()
  // channel_arn: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => MemberParam)
  @Expose()
  public members: MemberParam[];
}

export class RemoveMembersDTOs {
  @IsNotEmpty()
  @Type(() => RemoveMembersDTO)
  @ValidateNested()
  @Expose()
  data: RemoveMembersDTO;
  errors: RemoveMembersDTO[];
}
