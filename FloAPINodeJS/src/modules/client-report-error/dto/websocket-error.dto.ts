import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class ReportErrorParam {

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  error_code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  error_message: string;

  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  retries: number;

}

export class WebsocketErrorParam {

  @ApiProperty({ type: ReportErrorParam })
  @Type(() => ReportErrorParam)
  @IsNotEmpty()
  @Expose()
  data: ReportErrorParam;
  errors: any[];
}