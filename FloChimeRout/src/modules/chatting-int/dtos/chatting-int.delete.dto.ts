import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DeleteIntDTO {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  internal_channel_id: number;

  @Expose()
  @IsIn([0, 1])
  internal_channel_type: number;

  @Expose()
  @IsOptional()
  ref?: number;
}

export class DeleteMessageIntDTO extends DeleteIntDTO {
  @Expose()
  @IsString()
  internal_message_uid: string;
}

export class DeleteIntDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteIntDTO[];
  errors: DeleteIntDTO[];
}

export class DeleteMessageIntDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteMessageIntDTO[];
  errors: DeleteMessageIntDTO[];
}