
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  collection_id: {
    example: 1234,
    description: 'ID record of the collection table'
  },
  url: {
    example: 'http://example.com',
    description: 'Website\'s url'
  },
  title: {
    example: 'example title',
    description: 'Website\'s title'
  },
  recent_date: {
    example: 123456.123,
    description: ''
  },

  account_id: {
    required: false,
    example: 0,
    description: 'This is third party account setting ID, it supports the contact of a third-party account. Default value = 0 (Flo account)'
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBodyCreate = {
  "collection_id": RequestParam.collection_id.example,
  "url": RequestParam.url.example,
  "title": RequestParam.title.example,
  "recent_date": RequestParam.recent_date.example,
  "ref": RequestParam.ref.example
};

export const requestBodyUpdate = {
  "id": RequestParam.id.example,
  "collection_id": RequestParam.collection_id.example,
  "url": RequestParam.url.example,
  "title": RequestParam.title.example,
  "recent_date": RequestParam.recent_date.example
};

export const requestBodyDelete = {
  "id": RequestParam.id.example,
  "collection_id": RequestParam.collection_id.example
};