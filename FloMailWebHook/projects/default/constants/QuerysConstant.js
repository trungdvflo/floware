const Joi = require('joi');

module.exports = {
  CODE: Joi.number()
    .example(200)
    .description('The number of pages posted to the server'),
  FROM: Joi.string()
    .example('email@gmail.com')
    .description('List of received emails'),
  TO: Joi.string()
    .example('[email@gmail.com,email1@gmail.com]')
    .description('List of received emails'),
  SUBJECT: Joi.string()
    .optional()
    .allow("")
    .example('Subject')
    .description('Subject of the email'),
  SNIPPET: Joi.string()
    .example('Quote')
    .description('Quote the content of the email').allow('')
    .optional(),
  USER: Joi.string()
    .example('User')
    .description('Owner information of the email content'),
  UID: Joi.string()
    .example('Unique-String')
    .description('Unique string that identifies an email'),
  EVENT_NAME: Joi.string()
    .example('Action')
    .description('Action target'),
  FOLDER_NAME: Joi.string()
    .example('Name')
    .description('Name of inbox'),
  MESSAGE: Joi.string()
    .example('Internal Server Error')
    .description('The message returned to the client'),
  INTERNAL_SERVER_ERROR: Joi.string()
    .example('Internal Server Error')
    .description('Internal Server Error'),
  SERVICE_STATUS_MONITOR: Joi.string()
    .example('Internal Server Error')
    .description('Service status monitor'),
  ACTION: Joi.number()
    .example(1)
    .description('Linked mail-collection\'s action'),
  COLLECTION_ID: Joi.number()
    .example(1)
    .description('Linked mail-collection\'s collection_id'),
  PATH: Joi.string()
    .example('imap_folder')
    .description('Linked mail-collection\'s path'),
  FLO_MAIL_UID: Joi.number()
    .example(1)
    .description('Unique string that identifies an email'),
  DATE_SENT: Joi.number()
    .example(1668660046)
    .description('Date email sent')
};
