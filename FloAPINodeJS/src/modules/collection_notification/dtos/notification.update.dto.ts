import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsDefined,
    IsEnum,
    IsIn,
    IsInt, IsNotEmpty, IsNumber, IsPositive, ValidateNested
} from "class-validator";
import { NOTIFICATION_STATUS_VALUE } from "../../../common/constants";
import { IsOptionalCustom } from "../../../common/decorators";

export class UpdateNotificationDto {
    @IsPositive()
    @IsInt()
    @ApiProperty({
        example: 123
    })
    @IsDefined()
    @Expose()
    id: number;

    @IsInt()
    @ApiProperty({
        example: 1
    })
    @IsDefined()
    @IsEnum(NOTIFICATION_STATUS_VALUE, { each: true })
    @Expose()
    status: number;

    @IsPositive()
    @Expose()
    @IsNumber()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        description: "History time from client",
        example: 1670482750.042
    })
    action_time?: number;

    updated_date?: any;
}
export class UpdateNotificationDtos {
    @ApiProperty({
        type: [UpdateNotificationDto],
        isArray: true
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @Expose()
    data: UpdateNotificationDto[];
    errors: any[];
}
