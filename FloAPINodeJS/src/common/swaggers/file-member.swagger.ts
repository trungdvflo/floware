export const nameSwagger = 'File member';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },

  collection_id: {
    require: false,
    example: 1234,
    description: ''
  },

  uid: {
    example: 'f243c9b0-ecce-0137-541f-0242ac130004',
    description: 'uid file name of item which want to get'
  },

  client_id: {
    example: 'b3779fe7-43aa-48b1-916e-626d713ec517',
    description: ''
  },

  file: {
    type: 'file',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Binary file'
  },

  object_uid: {
    example: 'f243c9b0-ecce-0137-541f-0242ac130004',
    description: 'uid of caldav (current only support VJOURNAL),...'
  },

  uidCreate: {
    required:false,
    description: `Rule & description: <br> \
    - File name - store on server, it is unique and auto generate UID  <br> \
    - Note:  <br> \
        * if uid is blank, it will auto create new record.  <br> \
        * Otherwise, data will be update with this ui.`
  },

  local_path: {
    required:false,
    description: 'store local path of file'
  },

  object_type: {
    example: 'VJOURNAL',
    description: 'current only support VJOURNAL'
  },

  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBody = {
  calendar_uri: "3fedb245-ae49-11eb-b1c7-61e1c5e10b4d",
  organizer: {
      "cn":"Quang Nguyen",
      "email":"linhquang1986@gmail.com"
  },
  alerts: [{
    "uid": "4fb4bdf8-d710-474e-9def-961f5e132d2a",
    "action": "AUDIO",
    "summary": "Reminder",
    "trigger": {
        "days": 0,
        "past": true,
        "time": 1619654399,
        "hours": 0,
        "weeks": 1,
        "minutes": 0,
        "seconds": 0
    },
    "description": "Reminder"
  }],
  stodo: 0
};

export const requestBodyUpdate = {
  calendar_uri: "3fedb245-ae49-11eb-b1c7-61e1c5e10b4d",
  uid: "0a142215-0a81-4b89-bec3-235e9f6d65b1",
  organizer: {
    "cn":"Quang Nguyen",
    "email":"linhquang1986@gmail.com"
  },
  alerts: [{
    "uid": "4fb4bdf8-d710-474e-9def-961f5e132d2a",
    "action": "AUDIO",
    "summary": "Reminder",
    "trigger": {
        "days": 0,
        "past": true,
        "time": 1619654399,
        "hours": 0,
        "weeks": 1,
        "minutes": 0,
        "seconds": 0
    },
    "description": "Reminder"
  }],
  stodo: 0
};

export const requestBodySortUpdate = {
  "order_number": "12.00000",
  "order_update_time": 1566464330.816,
  "uid": "123-a",
  "account_id": 0,
  "object_href": "/calendarserver.php/calendars/auto.api_user3@flouat.net/d213dd00-dc9f-11eb-8f7c-99c3a377cf97"
};