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

export const CommentGetResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 123, // ID record history
            "collection_activity_id": 123456,
            "collection_id": 123,
            "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
            "object_type": "VTODO",
            "email": "abcxyz@flostage.com",
            "action": 0, // created
            "action_time": 12345.345,
            "content": "created new item",
            "created_date": 123456.234,
            "updated_date": 12345.678
          },
          {
            "id": 224,// ID record history
            "collection_activity_id": 123456,
            "collection_id": 123,
            "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
            "object_type": "VTODO",
            "email": "abcxyz@flostage.com",
            "action": 1, // edited
            "action_time": 12345.345,
            "content": "created new item",
            "created_date": 123456.234,
            "updated_date": 12345.678
          }
        ],
        "data_del": []
      }
    }
  }
};
export const CommentCreateResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 224,// ID record history
            "collection_activity_id": 123456,
            "collection_id": 123,
            "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
            "object_type": "VTODO",
            "email": "abcxyz@flostage.com",
            "action": 1, // edited
            "action_time": 12345.345,
            "content": "created new item",
            "created_date": 123456.234,
            "updated_date": 12345.678
          }
        ]
      }
    }
  }
};

export const CommentUpdateResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        "data": [
          {
            "id": 123, // ID record history
            "collection_activity_id": 123456,
            "collection_id": 123,
            "object_uid": "d5a68e33-ba04-11eb-a32e-5bed2a93fc42",
            "object_type": "VTODO",
            "email": "abcxyz@flostage.com",
            "action": 0, // created
            "action_time": 12345.345,
            "content": "created new item",
            "created_date": 123456.234,
            "updated_date": 12345.678
          }
        ]
      }
    }
  }
};
export const DeleteCommentRequest = {
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
export const DeleteCommentResponse = {
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
