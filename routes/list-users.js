"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:getUsers", req.params);
        Users.model.list().then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'GET', path: '/users', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "List all users in the system. Limited to staff",
            auth: 'token'
        }
    };
};

