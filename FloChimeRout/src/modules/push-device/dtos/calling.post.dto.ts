import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CALL_TYPE } from 'common/constants/system.constant';

export class AttendeeParam {
  @IsNotEmpty()
  @IsString()
  @Expose()
  public AttendeeId: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public ExternalUserId: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public JoinToken: string;
}
export class InviteeCallParam {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Expose()
  public Email: string;

  @IsNotEmpty()
  @IsObject()
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AttendeeParam)
  Attendee: AttendeeParam;
}

export class MediaPlacementParam {
  @IsNotEmpty()
  @IsString()
  @Expose()
  public AudioFallbackUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public AudioHostUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public EventIngestionUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public ScreenDataUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public ScreenSharingUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public ScreenViewingUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public SignalingUrl: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  public TurnControlUrl: string;
}

export class MeetingParam {
  @IsNotEmpty()
  @IsString()
  @Expose()
  public ExternalMeetingId: string;

  @Expose()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  MediaRegion: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  MeetingId: string;

  @IsNotEmpty()
  @IsObject()
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => MediaPlacementParam)
  public MediaPlacement: MediaPlacementParam;
}

export class CallingPushDTO {
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  Organizer: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => InviteeCallParam)
  @Expose()
  public Invitee: InviteeCallParam[];

  @Expose()
  @IsString()
  @IsNotEmpty()
  MeetingUrl: string;

  @Expose()
  @IsString()
  ExternalMeetingId: string;

  @Expose()
  @IsEnum(CALL_TYPE)
  CallType: number;

  @Expose()
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MeetingParam)
  Meeting: MeetingParam;

  constructor(partial?: Partial<CallingPushDTO>) {
    Object.assign(this, partial);
  }
}
export class SlientPushDTOs {
  @ValidateNested()
  @Type(() => CallingPushDTO)
  @Expose()
  data: CallingPushDTO;
  errors: any[];
}
