const Jwt = require('hapi-auth-jwt2');
const nuisance = require('nuisance');

module.exports = {
    active: true,
    register: [Jwt, nuisance] 
};
