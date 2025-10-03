
export const RequestPushParam = {
  organizer: {
    example: 'quangndn@flodev.net',
    description: 'Email of sender'
  },
  invitee: {
    required: true,
    isArray: true,
    description: `contain json format invitee`
  },
  room_url: {
    required: true,
    example: 'https:link_join_meeting',
    description: 'Link which these invitees can join in meeting'
  },
  room_id: {
    required: true,
    example: "3",
    description: 'Number of room'
  },
  meeting_url: {
    required: true,
    example: 'https:link_join_meeting',
    description: 'Link which these invitees can join in meeting'
  },
  meeting_id: {
    required: true,
    example: "3",
    description: 'ID of the meeting'
  },
  channel_id: {
    required: true,
    example: 223,
    description: 'ID of the conference channel'
  },
  title: {
    required: false,
    example: 'Jonh, Bill...',
    description: 'Title of the conference channel'
  },
  invite_status: {
    required: true,
    example: 1,
    description: ''
  },
  call_type: {
    required: true,
    example: 1,
    description: ''
  },
  device_token: {
    example: 'sf4UQ70O55rT6ajgrTsIl9i2caxvDK3emLJ5kypvXzvYH2oWItWuxUwOf4zaWVQn',
    description: 'Device token of user'
  },
};

export const requestPushBody = {
  "organizer": RequestPushParam.organizer.example,
  "invitee": [
    { "email": "thuongtest101@flouat.net" },
    { "email": "khoapm@flouat.net" }
  ],
  "room_url": RequestPushParam.room_url.example,
  "room_id": RequestPushParam.room_id.example,
  "meeting_url": RequestPushParam.meeting_url.example,
  "meeting_id": RequestPushParam.meeting_id.example,
  "invite_status": RequestPushParam.invite_status.example,
  "call_type": RequestPushParam.call_type.example
};
