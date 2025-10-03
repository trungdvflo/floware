import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray, IsInt, IsPositive, ValidateNested
} from "class-validator";

export class DeleteNotificationDto {
    @IsPositive()
    @Expose()
    @IsInt()
    @ApiProperty({ example: 123 })
    id: number;

    deleted_date?: any;
}
export class DeleteNotificationDtos {
    @ApiProperty({
        type: [DeleteNotificationDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: DeleteNotificationDto[];
    errors: any[];
}
