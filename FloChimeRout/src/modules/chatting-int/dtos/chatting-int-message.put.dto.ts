import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { IsOptionalCustom } from 'decorators/class-validation.decorator';
import { IChatMetadata } from 'modules/communication/interfaces/real-time.interface';

export class EditMessageIntDTO {
  @Expose()
  @IsInt()
  internal_channel_id: number;

  @Expose()
  @IsInt()
  internal_channel_type: number;

  @Expose()
  @IsString()
  internal_message_uid: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  msg: string;

  @Expose()
  @IsOptionalCustom()
  metadata?: IChatMetadata;
}
export class EditMessageIntDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: EditMessageIntDTO[];
  errors: EditMessageIntDTO[];
}