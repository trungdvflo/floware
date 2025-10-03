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

export const ConferencingGetResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 1,
            "room_url": "https://aws.amazon.com/chime/6bfd-5304bcf91171",
            "uid": "47a1-56574-8b275104-6bfd-5304bcf91171",
            "email": "abc@flomail.net",
            "is_creator": 1,
            "title": "Channel Work",
            "description": "This is description of Channel Work",
            "revoke_time": 0,
            "updated_date": 1660098207.9,
            "created_date": 1660098207.9,
            "vip": 0
          },
          {
            "id": 9,
            "room_url": "https://aws.amazon.com/chime/dghr4-5304bcf91171",
            "uid": "8b275104-6bfd-530447a1-56574-bcf91171",
            "email": "xyz@flomail.net",
            "is_creator": 1,
            "title": "Channel Play",
            "description": "This is description of Channel Play",
            "revoke_time": 0,
            "updated_date": 1660098207.9,
            "created_date": 1660098207.9,
            "vip": 1
          }
        ],
        "data_del": []
      }
    }
  }
};
export const ConferencingCreateResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 9,
            "room_url": "https://aws.amazon.com/chime/dghr4-5304bcf91171",
            "uid": "8b275104-6bfd-530447a1-56574-bcf91171",
            "email": "xyz@flomail.net",
            "is_creator": 1,
            "title": "Channel Play",
            "description": "This is description of Channel Play",
            "revoke_time": 0,
            "updated_date": 1660098207.9,
            "created_date": 1660098207.9,
            "vip": 1
          }
        ]
      }
    }
  }
};

export const MemberUpdateResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 12,
            "title": "Fail channel",
            "description": "Desciption of channel",
            "vip": 0,
            "updated_date": 1660797263.904,
            "room_url": "room_url",
            "email": "anph_po@flodev.net",
            "is_creator": 1,
            "uid": "91be35f5-0ac8-4190-8373-6056e1f21bf3",
            "created_date": 1659603732,
            "revoke_time": 0
          }
        ]
      }
    }
  }
};
export const LeaveChannelRequest = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 12
          }
        ]
      }
    }
  }
};
export const LeaveChannelResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 12
          }
        ],
      },
    }
  }
};
