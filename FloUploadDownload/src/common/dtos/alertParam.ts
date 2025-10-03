import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean, IsDefined,
  IsIn, IsInt, IsNotEmpty,
  IsString, IsUUID,
  Max, Min, ValidateNested
} from 'class-validator';

export class TriggerParam {
  @IsNotEmpty()
  @IsDefined()
  @IsBoolean()
  @ApiProperty({ example: false, description: 'Indicate if this trigger is in the past' })
  @Expose()
  public past: boolean;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(4)
  @ApiProperty({ example: 0, description: 'Week number of the trigger' })
  @Expose()
  public weeks: number;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(30)
  @ApiProperty({ example: 0, description: 'Day number of the trigger' })
  @Expose()
  public days: number;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(24)
  @ApiProperty({ example: 12, description: 'Hour number of the trigger' })
  @Expose()
  public hours: number;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(60)
  @ApiProperty({ example: 0, description: 'Minute number of the trigger' })
  @Expose()
  public minutes: number;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(60)
  @ApiProperty({ example: 0, description: 'Minute number of the trigger' })
  @Expose()
  public seconds: number;
}

export const alertActions = ['AUDIO', 'DISPLAY', 'EMAIL', 'PROCEDURE'];
export class AlertParam {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: '0ee41c62-a40e-11eb-b9ad-8703793be382' })
  @IsUUID()
  @Expose()
  public uid?: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @IsIn(alertActions)
  @ApiProperty({ example: 'AUDIO', description: 'Action of this alert' })
  @Expose()
  public action: string;

  @IsNotEmpty()
  @IsDefined()
  @ValidateNested()
  @Type(() => TriggerParam)
  @ApiProperty({ type: TriggerParam })
  @Expose()
  public trigger: TriggerParam;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'Describe this alert', description: 'String to describe this alert' })
  @Expose()
  public description: string;
}
