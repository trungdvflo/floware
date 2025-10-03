export const ApiGetResponseResult = {
  RES_200: {
    status: 200,
    description: 'Successful.',
  },
  RES_500: {
    status: 500,
    description: 'Internal server error'
  },
  RES_404: {
    status: 404,
    description: 'Not object found.'
  },
  RES_403: {
    status: 403,
    description: 'Forbidden.'
  },
  RES_400: {
    status: 400,
    description: 'Validation fail.', schema: {}
  }
};
