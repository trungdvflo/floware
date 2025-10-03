module.exports = {
  // active: process.env.SWAGGER_UI_ENABLED ? process.env.SWAGGER_UI_ENABLED.toLowerCase() === 'true' : false,
  options: {
    info: {
      title: 'Flo Mail PushWorker',
      version: 'v1.0.0'
    },
    basePath: '/',
    routesBasePath: '/',
    // swaggerUIPath: './',
    grouping: 'tags'
  }
};
