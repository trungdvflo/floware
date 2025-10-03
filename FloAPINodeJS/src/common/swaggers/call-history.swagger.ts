import { AttendeeParam } from "../../modules/calling-history/dtos/attendee.dto";

export const nameSwagger = 'Calling History';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  organizer: {
    example: 'quangngn@flomail.net',
    description: 'the email address of the organizer '
  },
  invitee: {
    required: true,
    example: 'trungdv2@flodev.net',
    description:'the email address of the invitee'
  },
  room_url: {
    required: true,
    example: 'url:room-abc',
    description: 'the URL of the room'
  },
  room_id: {
    required: true,
    example: 'D735AC90-F13C-4F68-AFC4-92D23B1C830B',
    description: 'the ID of the room'
  },
  call_start_time: {
    required: true,
    example: 1633492716,
    description: 'the start time call meeting'
  },
  call_end_time: {
    required: true,
    example: 1633492756,
    description: 'the end time call meeting'
  },
  call_type: {
    required: true,
    example: 1,
    description: `value = 1: video call; value = 2: audio call`
  },
  call_status: {
    required: true,
    example: 1,
    description: `value = 1: dial out / successful <br>
                  value = 2: dial-in / successful  <br>
                  value = 3: un-answer  <br>
                  value = 4: missing calling`
  },
  is_owner: {
    required: true,
    example: 1,
    description: `value = 0: user_id is not owner; value = 1: user_id is owner`
  },
  attendees: {
    required: true,
    type: AttendeeParam,
    isArray: true,
    example: [
      {"email": "aaa1@flomail.com"},
      {"email": "aaa2@flomail.com"}
    ],
    description:`contain json format attendees`
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBody = {
  "organizer": RequestParam.organizer.example,
  "invitee": RequestParam.invitee.example,
  "room_url": RequestParam.room_url.example,
  "room_id": RequestParam.room_id.example,
  "call_start_time": RequestParam.call_start_time.example,
  "call_end_time": RequestParam.call_end_time.example,
  "call_type": RequestParam.call_type.example,
  "call_status": RequestParam.call_status.example,
  "is_owner": RequestParam.is_owner.example,
  "attendees": RequestParam.attendees.example,
};
