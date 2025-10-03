module.exports = {
  active: process.env.SWAGGER_UI_ENABLED ? process.env.SWAGGER_UI_ENABLED.toLowerCase() === 'true' : false,
  options: {
    info: {
      title: 'Flo Admin NodeJS',
      version: '1.0.0'
    },
    basePath: '/',
    routesBasePath: '/',
    swaggerUIPath: './',
    grouping: 'tags'
  }
};
