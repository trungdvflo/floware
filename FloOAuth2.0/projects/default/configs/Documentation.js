let http = 'http';
let parseUrl = [];
try {
  const baseUrl = process.env.BASE_URL;
  parseUrl = baseUrl.split('://');
  http = parseUrl[0] ? parseUrl[0] : 'http';
} catch (error) {
  // throw error;
}
module.exports = {
  active: process.env.SWAGGER_UI_ENABLED === 'true',
  options: {
    info: {
      title: 'Flo OAuth 2.0',
      version: 'v1.0.0'
    },
    host: parseUrl[1],
    schemes: [http],
    basePath: '/',
    routesBasePath: '/',
    swaggerUIPath: './',
    grouping: 'tags',
    securityDefinitions: {
      OAuth2: {
        name: 'Authorization',
        in: 'header',
        type: 'apiKey',
        description: '* Submit value "Bearer $access_token", then execute the Introspection request, then click Try it out & Execute button.'
      }
    }
  }
};
