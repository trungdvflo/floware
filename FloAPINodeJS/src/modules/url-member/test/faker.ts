import { datatype } from 'faker';

export function fakeDataEntity() {
  return {
    id: datatype.number(),
    url: datatype.string(),
    uid: datatype.string(),
    title: datatype.string(),
    order_number: datatype.number(),
    order_update_time: datatype.number(),
    recent_date: datatype.number(),
    owner: 'email.test@flomail.com',
    is_trashed: 0,
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeDataDelEntity() {
  return {
    "id": datatype.number(),
    "item_id": datatype.number(),
    "item_uid": datatype.string(),
    "is_recovery": 0,
    "created_date": 0,
    "updated_date": 0
  };
}

export function fakeCreatedDTO(collectionId: number) {
  return {
    "collection_id": collectionId,
    "url": datatype.string(),
    "title": datatype.string(),
  };
}

export function fakeCreatedPermissionDTO() {
  return [{
    user_id: 1,
    member_user_id: 1,
    account_id: 1,
    collection_id: 1,
    access: 1,
    shared_status: 1,
    owner_email: 'test@flomail.com'
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    collection_id: 2,
    access: 2,
    shared_status: 1,
    owner_email: 'test@flomail.com'
  }];
}

export function fakeCreatedPermissionDTO2() {
  return [{
    user_id: 1,
    member_user_id: 1,
    account_id: 1,
    collection_id: 1,
    access: 1,
    shared_status: 2,
    owner_email: 'test@flomail.com',
    recent_date: 123123123.123
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    collection_id: 2,
    access: 2,
    shared_status: 1,
    owner_email: 'test@flomail.com',
    recent_date: 123123123.123
  }];
}

export function fakeCreatedPermissionDTO3() {
  return [{
    user_id: 1,
    member_user_id: 1,
    account_id: 1,
    id: 1,
    collection_id: 1,
    access: 1,
    shared_status: 2,
    owner_email: 'test@flomail.com'
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    id: 2,
    collection_id: 2,
    access: 2,
    shared_status: 1,
    owner_email: 'test@flomail.com'
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    id: 3,
    collection_id: 3,
    access: 3,
    shared_status: 1,
    owner_email: 'test@flomail.com'
  }];
}

export function fakeCreatedPermissionDTO4() {
  return [{
    user_id: 1,
    member_user_id: 1,
    account_id: 1,
    id: 1,
    collection_id: 1,
    access: 3,
    shared_status: 1,
    owner_email: 'test@flomail.com',
    recent_date: 123123123.123,
    is_trashed: 0
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    id: 2,
    collection_id: 2,
    access: 2,
    shared_status: 1,
    owner_email: 'test@flomail.com',
    recent_date: 123123123.123,
    is_trashed: 1
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    id: 3,
    collection_id: 3,
    access: 2,
    shared_status: 1,
    owner_email: 'test@flomail.com',
    recent_date: 123123123.123,
    is_trashed: 1
  }, {
    user_id: 1,
    member_user_id: 1,
    account_id: 2,
    id: 4,
    collection_id: 4,
    access: 2,
    shared_status: 1,
    owner_email: 'test@flomail.com',
    recent_date: 123123123.123,
    is_trashed: 1
  }];
}

export function fakeUpdateDTO(id: number, collectionId: number) {
  return {
    "id": id,
    "collection_id": collectionId,
    "url": datatype.string(),
    "title": datatype.string()
  };
}

export function fakePermissionDTO() {
  return [{
    id: 1,
    url: 'https://www.yahoo.com/news',
    uid: 'uid',
    title: 'Yahoo News - Latest News & Headlines',
    order_number: 2,
    order_update_time: 0,
    recent_date: 0,
    is_trashed: 0,
    collection_id: 1,
    access: 2,
    user_id: 1,
    shared_status: 1,
    owner_email: 'test@flostage.com',
    created_date: 1639043328.417,
    updated_date: 1639043328.417,
  }, {
    id: 2,
    url: 'https://www.yahoo.com/news',
    uid: 'uid',
    title: 'Yahoo News - Latest News & Headlines',
    order_number: 2,
    order_update_time: 0,
    recent_date: 0,
    is_trashed: 0,
    collection_id: 2,
    access: 2,
    user_id: 1,
    shared_status: 1,
    owner_email: 'tientest156@flostage.com',
    created_date: 1639043328.417,
    updated_date: 1639043328.417,
  }];
}

export function fakeDeleteDTO(id: number, collectionId: number) {
  return {
    "id": id,
    "collection_id": collectionId
  };
}