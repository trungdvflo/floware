module.exports = {
  SQS: [{
    active: true,
    name: 'SQS_SignUp', // FileName >> utilities/aws/{file}.js 
    config: {
      QUEUE_NAME: process.env.AWS_SQS_SIGNUP_QUEUE_NAME,
      REGION: process.env.AWS_SQS_REGION
    }
  }]
};

