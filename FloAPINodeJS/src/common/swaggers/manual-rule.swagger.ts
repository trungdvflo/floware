export const nameSwagger = 'Manual rules';
export const RequestParam = {
  id: {
    example: 123,
    description: 'this is ID record, read-only'
  },
  name: {
    example: 'floware 1',
    description: 'this is the name of rule'
  },
  match_type: {
    example: 1,
    description: ''
  },
  order_number: {
    example: 1,
    description: ``
  },
  is_enable: {
    require: false,
    example: 1,
    description: ``
  },
  apply_all: {
    require: false,
    example: 1,
    description: ``
  },
  account_id: {
    require: false,
    example: 0,
    description: ``
  },
  conditions: {
    example: [
    {
      "condition": 1,
      "operator": 2,
      "value": ""
    }
  ],
    description: ``
  },
  destinations: {
    example: [
    {
      "action": 1,
      "value": ""
    }
  ],
    description: ''
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const RequestExecuteParam = {
  action: {
    example: 60,
    description: 'Move mail to Collection'
  },
  value: {
    require: false,
    example: 'my_folder',
    description: 'Path move the email to'
  },
  collection_id: {
    example: 123,
    description: 'Id of the collection where is moved the email'
  },
  username: {
    example: 'username@flomail.net',
    description: `The username/email of user`
  },
  uid: {
    example: {
      uid: 1,
      path: 'my_folder'
    },
    description: ``
  },
  ref: {
    required: false,
    example: '3700A1BD-EB0E-4B8E-84F9-06D63D672D2C',
    description: 'it is client id, we allow string or number type'
  }
};

export const requestBodyUpdateManualRule = {
  "id": 1,
  "name": RequestParam.name.example,
  "match_type": RequestParam.match_type.example,
  "order_number": RequestParam.order_number.example,
  "is_enable": RequestParam.is_enable.example,
  "apply_all": RequestParam.apply_all.example,
  "account_id": RequestParam.account_id.example,
  "conditions": RequestParam.conditions.example,
  "destinations": RequestParam.destinations.example,
};

export const requestBodyDeleteManualRule = {
  "id": 1,
};

export const requestBody = {
  "name": RequestParam.name.example,
  "match_type": RequestParam.match_type.example,
  "order_number": RequestParam.order_number.example,
  "is_enable": RequestParam.is_enable.example,
  "account_id": RequestParam.account_id.example,
  "conditions": RequestParam.conditions.example,
  "destinations": RequestParam.destinations.example,
  "ref": RequestParam.ref.example
};
