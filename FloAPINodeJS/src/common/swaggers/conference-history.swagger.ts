export const nameSwagger = 'Conference History';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  channel_id: {
    example: 2,
    description: 'ID of this channel'
  },
  attendees: {
    example: [
      { "email": "user1@flomail.net" },
      { "email": "user2@flomail.net" }
    ],
    description: 'list of people in the call at the time history created.'
  },
  meeting_id: {
    example: '9fe1ec0c-0351-11ee-b1cc-acde48001122',
    description: 'ID of meeting from chime server'
  },
  phone_number: {
    example: '+84987654321',
    description: 'Is phone number, phone number of user is added to the conference'
  },
  invitee: {
    example: 'abc@flomail.net',
    description: 'Is email, email of user is added to the conference'
  },
  organizer: {
    example: 'abc@flomail.net',
    description: 'Is email, email of user start a conferencing'
  },
  start_time: {
    example: '1234523116.123',
    description: 'time start the call'
  },
  end_time: {
    example: '1234523116.123',
    description: 'time end the call'
  },
  action_time: {
    example: '1234523116.123',
    description: 'time answer: joined, cancel, declined,..'
  },
  status: {
    example: '10',
    description: 'Status of the history'
  },
  type: {
    example: '1',
    description: '1: video call, 2: audio call'
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};
