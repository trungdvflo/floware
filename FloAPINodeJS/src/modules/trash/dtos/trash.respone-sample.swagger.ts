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
          "message": "object_type must be a valid enum value, object_type must be a string, object_type should not be empty",
          "attributes": {
              "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
          }
      }
  ]
};
export const TrashGetReponse = {
  RES_200: {
    status: 200,
    description: 'Successful.',
    schema: {
      example: {
        "data": [
          {
            "id": 33783,
            "created_date": 154537243.833,
            "updated_date": 1545312243.833,
            "object_id": 10,
            "object_uid": "4bab9469-f06c-4508-a857-b7b4df4df42f",
            "object_type": "VTODO",
            "object_href": "source_root_uid + / + uid.ics for flo account CalDav; source_root_uid + / + uid.vcf for flo account CardDav;",
          }
        ],
        "data_del": [
          {
            "id": 33787,
            "created_date": 154537243.833,
            "updated_date": 1545372143.833,
            "item_type": "VEVENT",
            "is_recovery": 0
          }
        ]
      }
    }
  },
};

export const TrashCreateReponse = {
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
            "object_uid": "4bab9469-f06c-4508-a857-b7b4df4df42f",
            "object_type": "VTODO",
            "object_href": "source_root_uid + / + uid.ics for flo account CalDav; source_root_uid + / + uid.vcf for flo account CardDav;",
            "ref": "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C",
          }
        ],
        "error": error
      }
    }
  },
};

export const TrashUpdateReponse = {
  RES_200: { status: 200, description: 'The record has been successfully updated.',
  schema: {
    example: {
      "data": [
        {
          "id": 33781,
          "created_date": 1545372243.833,
          "updated_date": 1545372243.833,
          "object_id": 10,
          "object_uid": "4bab9469-f06c-4508-a857-b7b4df4df42f",
          "object_type": "VTODO",
          "object_href": "source_root_uid + / + uid.ics for flo account CalDav; source_root_uid + / + uid.vcf for flo account CardDav;",
        }
      ],
      "error": error
    }
  }},
};

export const TrashDeleteReponse = {
  RES_200: {
    status: 200,
    description: 'The record has been successfully deleted.',
    schema: {
      example: {
        "data": [
          {
            "id": 33781
          }
        ],
        "error": {
          "errors": [
            {
              "message": "The item does not exist",
              "code": "objectNotExist",
              "attributes": {
                "id": 33781
              }
            }
          ]
        }
      }
    }
  },
};

export const TrashRecoverReponse = {
  RES_200: {
    status: 200,
    description: 'The record has been successfully deleted.',
    schema: {
      example: {
        "data": [
          {
            "id": 33781
          }
        ],
        "error": {
          "errors": [
            {
              "message": "The item does not exist",
              "code": "objectNotExist",
              "attributes": {
                "id": 33781
              }
            }
          ]
        }
      }
    }
  },
};