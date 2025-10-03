export const nameSwagger = 'Collection Member';

export const RequestParam = {
  id: {
    example: 1,
    description: 'Collection id',
  },
  shared_status: {
    example: 0,
    description:
      '0 is waiting to accept Collection Member invitation, 1 is joined Collection Member, 2 is declined Collection Member',
  },
  owner: {
    example: 'nguyenvana@flomail.net',
    description: 'Email owner created share collection',
  },
  created_date: {
    example: 1618486501.812,
    description: 'Created time of this collection in UNIX timestamp',
  },
  updated_date: {
    example: 1618486501.812,
    description: 'Updated time of this collection in UNIX timestamp',
  },
};
