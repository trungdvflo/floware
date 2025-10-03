import { MSG_TOKEN_INVALID } from "../../../common/constants/message.constant";

// NOSONAR
export const AuthorizationError = {
  RES_401: {
    status: 401,
    schema: {
      example: {
        message: MSG_TOKEN_INVALID
      }
    }
  }
};
const error = {
  "errors": [
      {
          "code": "validationFailed",
          "message": "url must be an URL address",
          "attributes": {
              "url": ".com/asia",
              "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
          }
      }
  ]
};
export const UrlGetReponse = {
  RES_200: {
    status: 200,
    description: 'Successful.',
    schema: {
      example: {
        "data": [
          {
            "id": 33781,
            "created_date": 154537243.833,
            "updated_date": 154537243.833,
            "url": "https://www.wsj.com/asia",
            "title": "The Wall Street Journal",
            "order_number": 1,
            "order_update_time": 1537164860.201,
            "is_trashed": 0
          }
        ],
        "data_del": [
          {
            "id": 61145,
            "item_type": "URL",
            "item_id": "4695",
            "created_date": 1592903225.487,
            "updated_date": 1592903225.487,
            "is_recovery": 1
          },
          {
            "id": 61155,
            "item_type": "URL",
            "item_id": "4696",
            "created_date": 1592903355.767,
            "updated_date": 1592903355.768,
            "is_recovery": 0
          }
        ]
      }
    }
  },
};

export const UrlCreateReponse = {
  RES_200: {
    status: 200,
    description: 'The record has been successfully created.',
    schema: {
      example: {
        "data": [
          {
            "id": 33781,
            "created_date": 1545372243.833,
            "updated_date": 1545372243.833,
            "url": "https://www.wsj.com/asia",
            "title": "The Wall Street Journal",
            "order_number": 1,
            "order_update_time": 1537164860.201,
            "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
          }
        ],
        "error": error
      }
    }
  },
};

export const UrlUpdateReponse = {
  RES_200: {
    status: 200,
    description: 'The record has been successfully created.',
    schema: {
      example: {
        "data": [
          {
            "id": 33781,
            "created_date": 1545372243.833,
            "updated_date": 1545372243.833,
            "url": "https://www.wsj.com/asia",
            "title": "The Wall Street Journal"
          }
        ],
        "error": error
      }
    }
  },
};

export const UrlDeleteReponse = {
  RES_200: {
    status: 200,
    description: 'The record has been successfully created.',
    schema: {
      example: {
        "data": [
          {
            "uid": "efb5a6ba-b009-4608-9621-2806ea2a5299"
          }
        ],
        "error": {
          "errors": [
            {
              "code": 'objectNotExist',
              "message": "The item does not exist",
              "attributes": {
                "uid": "efb5a6ba-b009-4608-9621-2806ea2a5299"
              }
            }
          ]
        }
      }
    }
  },
};