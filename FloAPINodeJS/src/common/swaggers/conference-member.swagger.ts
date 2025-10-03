export const nameSwagger = 'Conference Member';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  channel_id: {
    example: 2,
    description: 'ID of this channel'
  },
  uid: {
    example: '123456.123',
    description: 'this is the name of system collection'
  },
  is_creator: {
    example: 1,
    description: '[0, 1, 2]: 1 is creator'
  },
  email: {
    example: 'trungdv@flomail.net',
    description: 'email of member'
  },
  title: {
    example: 'Private Group',
    description: ''
  },
  revoke_time: {
    example: '123456.123',
    description: 'this is the name of system collection'
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};
