import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsDefined,
    IsEnum,
    IsIn, IsInt, IsNotEmpty, IsNumber,
    IsPositive,
    IsString, ValidateIf, ValidateNested
} from "class-validator";
import { HISTORY_ACTION, OBJECT_SHARE_ABLE } from "../../../common/constants";
import { IsCommentObjectUid, IsOnlyAssignedTOATodo, IsOptionalCustom } from "../../../common/decorators";
import { EmailDTO } from "../../../common/dtos/email.dto";
import { GeneralObjectId } from "../../../common/dtos/object-uid";
import {
    OBJECT_UID_TRANSFORMER
} from '../../../common/transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
export class CreateHistoryDto {
    @IsPositive()
    @Expose()
    @IsInt()
    @ApiProperty({
        example: 123
    })
    @IsDefined()
    collection_id: number;

    @IsInt()
    @IsPositive()
    @ApiProperty({ example: 123 })
    @ValidateIf((o) => [
        HISTORY_ACTION.COMMENTED,
        HISTORY_ACTION.UPDATED_COMMENT,
        HISTORY_ACTION.DELETED_COMMENT
    ].includes(o.action)
    )
    @Expose()
    comment_id?: number;

    @IsNotEmpty()
    @ApiProperty({
        example: "VTODO"
    })
    @IsString()
    @Expose()
    @IsEnum(OBJECT_SHARE_ABLE)
    @IsDefined()
    @IsOnlyAssignedTOATodo()
    object_type: OBJECT_SHARE_ABLE;

    @ApiPropertyOptional({
        example: "4bab9469-f06c-4508-a857-b7b4df4df42f"
    })
    @IsCommentObjectUid()
    @Expose()
    @Transform(OBJECT_UID_TRANSFORMER)
    @IsDefined()
    object_uid: GeneralObjectId;

    @IsInt()
    @Expose()
    @IsOptionalCustom()
    @IsIn(Object.values(HISTORY_ACTION))
    @ApiPropertyOptional({
        description: `History action from client \n
        value = 0 >> created (default )
        value = 1  >> edited
        value = 2  >> moved/ remove
        value = 3  >> deleted
        value = 4  >> completed (mark done)
        value = 41 >> undone (mark undone)
        value = 5  >> completed/done sub-task
        value = 51 >> un-completed/undone sub-task
        value = 6  >> commented
        value = 61 >> updated comment
        value = 62 >> deleted comment
        value = 7  >> approved
        value = 8  >> changed date
        value = 9  >> changed time
        value = 10 >> changed location
        value = 11 >> rejected
        value = 12 >> started
        value = 13 >> trashed
        value = 14 >> recovered
        value = 15 >> Added
        value = 16 >> Removed
        value = 17 >> Assigned
        value = 18 >> Un-Assigned`,
        example: 1
    })
    action: number;

    @IsPositive()
    @Expose()
    @IsNumber()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        description: "History time from client",
        example: 1670482750.042
    })
    action_time: number;

    @IsString()
    @Expose()
    @ApiProperty({
        description: "Content history submit by client",
        example: 'This is a history'
    })
    @IsNotEmpty()
    @IsOptionalCustom()
    @Transform(TRIM_STRING_TRANSFORMER)
    content: string;

    @Expose()
    @IsInt()
    @IsOptionalCustom()
    @ApiPropertyOptional({
        description: "Id parent history (using for reply history)",
        example: 167
    })
    parent_id: number;

    @ApiPropertyOptional({
        example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
    })
    @IsString()
    @IsOptionalCustom()
    @Expose()
    ref?: string;

    @IsArray()
    @ApiProperty({
        type: EmailDTO,
        isArray: true, example: [{
            email: 'anph@flomail.net'
        }, {
            email: 'anph@flomail.net'
        }]
    })
    @ArrayMinSize(1)
    @Type(() => EmailDTO)
    @ValidateIf((o) => [
        HISTORY_ACTION.ASSIGNED,
        HISTORY_ACTION.UN_ASSIGNED
    ].includes(o.action))
    @ValidateNested({ each: true })
    @Expose()
    assignees?: EmailDTO[];

    vassignees?: string;

    created_date: number;
    updated_date: number;
}
export class CreateHistoryDtos {
    @ApiProperty({
        type: [CreateHistoryDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    data: CreateHistoryDto[];
    errors: any[];
}