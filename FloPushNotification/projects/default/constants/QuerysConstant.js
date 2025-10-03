const Joi = require('joi');

module.exports = {
    CODE: Joi.number().description('The number of pages posted to the server'),
    FROM: Joi.string().description('Emails are sent from the form address'),
    TO: Joi.string().description('List of received emails'),
    SUBJECT: Joi.string().description('Subject of the email'),
    SNIPPET: Joi.string().description('Quote the content of the email').allow('').optional(),
    USER: Joi.string().description('Owner information of the email content'),
    UID: Joi.string().description('Unique string that identifies an email'),
    EVENT_NAME: Joi.string().description('Action target'),
    FOLDER_NAME: Joi.string().description('Name of inbox'),
    MESSAGE: Joi.string().description('The message returned to the client')    
};
