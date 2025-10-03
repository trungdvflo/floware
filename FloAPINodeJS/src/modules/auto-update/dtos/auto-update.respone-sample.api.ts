export const AutoUpdateDownloadReponse = {
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
    description: 'Downloaded file does not exist.',
    schema: {
      example: {
        "code": 404,
        "error": {
          "message": "Downloaded file does not exist"
        }
      }
    }
  },
  RES_403: {
    status: 403,
    description: 'Forbidden.'
  },
  RES_400: {
    status: 400,
    description: 'Validation fail.',
    schema: {
      example: {
        "code": 400,
        "error": {
          "message": "Invalid data"
        }
      }
    }
  }
};

export const AutoUpdateGetVersionReponse = {
  RES_200: {
    status: 200,
    description: 'Successful.',
    schema: {
      example: {
        "code": 200,
        "data": {
          "version": "1.0.1",
          "checksum": "7cLALFUHSwvEJWSkV8aMreoBe4fhRa4FncC5NoThKxwThL6FDR7hTiPJh1fo2uagnPogisnQsgFgq6mGkt2RBw==",
          "release_note": "<b>Release note</b>",
          "release_time": 1566464330.816,
          "build_number": 19082701,
          "os_support": "10.14",
          "length": 105762775,
          "link_download": "https://apigw.flouat.net/v3.3.0/node/downloads?type=auto_update&uuid=mztdw7ltkbeh2-201909259-1568620854475",
          "message": "string"
        }
      }
    }
  },
  RES_200_2: {
    status: 200,
    description: 'Not release any versions yet.',
    schema: {
      example: {
        "code": 'notReleaseVersion',
        "data": {
          "message": "Not release any versions yet"
        }
      }
    }
  },
  RES_500: {
    status: 500,
    description: 'Internal server error'
  },
  RES_404: {
    status: 404,
    description: 'Request not found.'
  },
  RES_403: {
    status: 403,
    description: 'Forbidden.'
  },
};