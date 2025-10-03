export const nameSwagger = 'Share member';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  collection_id: {
    example: 1234,
    description: 'ID record of the collection table'
  },
  calendar_uri: {
    example: '3fedb245-ae49-11eb-b1c7-61e1c5e10b4d',
    description:'This is shared calendar for member, each member will be shared one calendar, it will contain calendar uri of table [calendarinstance] of sabreDAV'
  },
  access: {
    example: 1,
    description: `This is permission shared collection<br>
    value = 0: owner <br>
    value = 1: read  <br>
    value = 2: read-write`
  },
  shared_email: {
    example: 'quangndn@flomail.net',
    description: 'This contains the Flo email address who shared collection by the owner'
  },
  member_shared_status: {
    example: 1,
    description: `The status of the shared collection<br>
    value = 1: joined <br>
    value = 2: declined <br>
    value = 4: leave shared collection`
  },
  shared_status: {
    example: 1,
    description: `The status of the shared collection<br>
    value = 0: waiting <br>
    value = 1: joined <br>
    value = 2: declined <br>
    value = 3: removed by owner <br>
    value = 4: leave shared collection`
  },
  contact_uid: {
    example: '4fb4bdf8-d710-474e-9def-961f5e132d2a',
    description: 'it will contain the contact UID. Purpose >> the client app always uses the same contact (this contact is not shared )'
  },
  contact_href: {
    example: '467b7690-19ee-11ec-b1db-8ff243ad6de9',
    description: 'it is href of the contact, it allows the Flo app to know the contact belong to the address book (this contact is not shared )'
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

export const requestBodyUpdateShareMember = {
  "id": 1,
  "access": RequestParam.access.example,
  "shared_status": RequestParam.shared_status.example
};

export const requestBodyUnShareMember = {
  "id": 1,
};

export const requestBodyStatusShareMember = {
  "id": 1,
  "shared_status": RequestParam.shared_status.example
};

export const requestBodyLeaveShareMember = {
  "id": RequestParam.collection_id.example,
};

export const requestBody = {
  "collection_id": RequestParam.collection_id.example,
  "calendar_uri": RequestParam.calendar_uri.example,
  "access": RequestParam.access.example,
  "shared_email": RequestParam.shared_email.example,
  "contact_uid": RequestParam.contact_uid.example,
  "contact_href": RequestParam.contact_href.example,
  "account_id": RequestParam.account_id.example,
  "ref": RequestParam.ref.example
};
