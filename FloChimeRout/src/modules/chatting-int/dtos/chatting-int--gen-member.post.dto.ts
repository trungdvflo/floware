import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { IsOptionalCustom } from 'decorators/class-validation.decorator';

export class GenMemberDTO {
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
}

export class GenMemberDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: GenMemberDTO[];
  errors: GenMemberDTO[];
}