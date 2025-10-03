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

export const ReportErrorResponse = {
  RES_200: {
    status: 200,
    schema: {
      example: {
        data: {
            result: "success"
       }
    }
    }
  }
};
