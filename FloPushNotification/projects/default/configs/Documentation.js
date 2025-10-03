/* eslint-disable no-console */
let http = 'http';
try {
    const baseUrl = process.env.BASE_URL;
    const parseUrl = baseUrl.split('://');
    http = parseUrl[0] ? parseUrl[0] : 'http';
} catch (error) {
    console.error('------- Error---------');
    console.error('-------Could not read environment variable------');
    throw error;
}
module.exports = {
    active: true,
    options: {
        info: {
            title: 'Flo Push Message',
            version: 'V1.0.0'
        },
        schemes: [http],
        basePath: process.env.BASE_PATH ? process.env.BASE_PATH : '/',
        swaggerUIPath: process.env.BASE_PATH ? process.env.BASE_PATH : '/swaggerui/',
        grouping: 'tags',
        tags: [],
        securityDefinitions: {
            // KeyApi: {
            //     type: 'apiKey',
            //     name: 'keyapi',
            //     in: 'header',
            //     description: '* Value authentication of User information'
            // },
            // Authorization: {
            //     name: 'authorization',
            //     in: 'header',
            //     type: 'apiKey',
            //     description: '* Submit value "Bearer $access_token", then execute the Introspection request, then click Try it out & Execute button.'
            // }
        },
        security: [
            {
                // KeyApi: [],
                // Authorization: [],
                // AppId: []
            }
        ]
    }
};
