import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  registerDecorator
} from "class-validator";
import { IsValidateMentionInChat } from "../../../common/decorators";
import {
  ChannelTypeNumber
} from "../../communication/interfaces";
import { ChatMarkedDto, ChatMetadataDTO } from "./chat.metadata.dto";

export const validateChatMessage = ({ metadata, marked }) =>
  (!metadata?.attachments?.length && !marked) || metadata?.mentions?.length;

const IsReplyQuoteForwardMessage = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsReplyQuoteForwardMessage',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const { parent_uid, marked } = args.object as PostChatDTO;
          return !(parent_uid && marked);
        },
        defaultMessage(args: ValidationArguments) {
          return 'parent_uid and marked are not allowed at the same time.';
        },
      },
    });
  };
};

export class PostChatDTO {
  @IsDefined()
  @IsEnum(ChannelTypeNumber)
  @Transform(({ value }) => Number(value))
  @Expose()
  channel_type: ChannelTypeNumber;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Expose()
  channel_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Type(() => ChatMetadataDTO)
  @ValidateNested()
  metadata: ChatMetadataDTO;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsDefined()
  @Expose()
  @IsValidateMentionInChat()
  @ValidateIf(validateChatMessage)
  message_text: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsUUID(4)
  @Expose()
  @IsReplyQuoteForwardMessage()
  parent_uid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Type(() => ChatMarkedDto)
  @IsReplyQuoteForwardMessage()
  @ValidateNested()
  marked?: ChatMarkedDto;

  @ApiPropertyOptional({
    example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
  })
  @IsString()
  @IsOptional()
  @Expose()
  ref?: string;

  created_date?: number;
}

export class PostChatDTOs {
  @ApiProperty({
    type: PostChatDTO
  })
  @Type(() => PostChatDTO)
  @ValidateNested()
  @IsObject()
  @Expose()
  data: PostChatDTO;
  errors: any[];
}