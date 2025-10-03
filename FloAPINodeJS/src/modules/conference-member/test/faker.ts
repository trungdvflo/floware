export const fakeQuery = {
  identifiers: [ { id: 1569579 } ],
  generatedMaps: [
    {
      id: 1569579,
      is_creator: 2,
      view_chat_history: 1,
      join_time: 1704187969.742
    }
  ],
  raw:  {
    fieldCount: 0,
    affectedRows: 1,
    insertId: 1569579,
    serverStatus: 2,
    warningCount: 1,
    message: '',
    protocol41: true,
    changedRows: 0
  }
};

export const fakeCreateNoDubplicates= [
  {
      "id": 118,
      "email": "tester001@flomail.net",
      "is_creator": 0,
      "updated_date": 1660806438.789,
      "created_date": 1660806438.789,
      "title": "test 0",
      "description": null,
      "revoke_time": 0,
      "uid": "uid",
      "avatar": "",
      "channel_id": 1
  }
];

export const fakeCreateDetails = [
  {
      "id": 117,
      "email": "trungdv002@flowmail.flodev.net",
      "is_creator": 0,
      "updated_date": 1660806438.789,
      "created_date": 1660806438.789,
      "title": null,
      "description": null,
      "revoke_time": 0,
      "uid": "uid",
      "avatar": "",
      "channel_id": 2
  },
  {
    "id": 117,
    "email": "trungdv002@flowmail.flodev.net",
    "is_creator": 0,
    "updated_date": 1660806438.789,
    "created_date": 1660806438.789,
    "title": null,
    "description": null,
    "revoke_time": 0,
    "uid": "uid",
    "avatar": "",
    "channel_id": 2
  },
  {
    "id": 117,
    "email": "trungdv003@flowmail.flodev.net",
    "is_creator": 0,
    "updated_date": 1660806438.789,
    "created_date": 1660806438.789,
    "title": null,
    "description": null,
    "revoke_time": 0,
    "uid": "uid",
    "avatar": "",
    "channel_id": 2
  }
];
export const fakeDeleteDetails = [
  {
      "id": 117,
      "revoke_time": 1230,
  },
];