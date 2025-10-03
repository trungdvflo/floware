import { AlertParam } from "../dtos/alertParam";
import { OrganizerParam } from "../dtos/organizer-todo.dto";

export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },

  uid: {
    example: 'f243c9b0-ecce-0137-541f-0242ac130004',
    description: `create by server`
  },

  calendarid: {
    example: 1,
    description: `Calendarid in table CalendarInstance`
  },

  calendar_object_id: {
    required: false,
    example: 1,
    description: `Id of calendarobjects table`
  },

  uri: {
    example: 'f243c9b0-ecce-0137-541f-0242ac130004.ics',
    description: `uri of todo object`
  },

  star: {
    required: false,
    example: 1,
    description: `default = 0; not star = 0, star = 1`
  },

  description: {
    required: false,
    example: '',
    description: `description of todo`
  },

  summary: {
    required: false,
    example: '',
    description: `this is title of todo`
  },

  location: {
    required: false,
    example: '',
    description: `the location of todo`
  },

  completed_date: {
    required: false,
    example:'',
    description: `completed date`
  },

  due_date: {
    required: false,
    example:'',
    description: `due date`
  },

  duration: {
    required: false,
    example:'',
    description: `the duration of todo`
  },

  subtasks: {
    required: false,
    type: AlertParam,
    isArray: true,
    description:`contain json format sub-tasks`
  },

  alerts: {
    required: false,
    type: AlertParam,
    isArray: true,
    description:`contain json format alerts`
  },

  stodo: {
    required: false,
    example: 1,
    description: `0: no schedule, 1: had schedule`
  },

  status: {
    required: false,
    example:'',
    description: ``
  },

  organizer: {
    required: false,
    type: OrganizerParam,
    isArray: false,
    description:``
  },

  sequence: {
    required: false,
    example:'',
    description: ``
  },

  start: {
    required: false,
    example:'',
    description: ``
  },

  repeat_rule: {
    required: false,
    example:'',
    description: `rule is repeated`
  },

  timezone: {
    required: false,
    example:'',
    description: `timezone time`
  },

  tzcity: {
    required: false,
    example:'',
    description: `timezone of city`
  },

  is_trashed: {
    required: false,
    example: 0,
    description: `default = 0; trashed = 1, not trashed = 0 `
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