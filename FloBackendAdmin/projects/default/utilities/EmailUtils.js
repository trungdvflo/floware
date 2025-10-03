/* eslint-disable no-param-reassign */

const trimQuotes = (value) => {
    value = (value || '').trim();    
    if ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"')
    || (value.charAt(0) === '\'' && value.charAt(value.length - 1) === '\'')
    || (value.charAt(0) === '<' && value.charAt(value.length - 1) === '>')) {
        value = value.substr(1, value.length - 2);
    }
    return value;
};
module.exports = { trimQuotes };
