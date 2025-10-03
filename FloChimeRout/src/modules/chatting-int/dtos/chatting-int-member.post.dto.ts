import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { IsOptionalCustom } from 'decorators/class-validation.decorator';

export class MemberChannelDTO {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  internal_channel_id: number;

  @Expose()
  @IsIn([0, 1])
  internal_channel_type: number;

  @Expose()
  @IsInt()
  internal_user_id: number;

  @Expose()
  @IsString()
  @IsEmail()
  internal_user_email: string;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  ref?: number;

  emailOwner?: string;
}

export class MemberChannelDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: MemberChannelDTO[];
  errors: MemberChannelDTO[];
}