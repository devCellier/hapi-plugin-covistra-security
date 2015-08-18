"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:deleteUsers", req.payload);
        Users.model.delete(req.params.username).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'DELETE', path: '/users/{username}', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "Delete a user in the system. Limited to staff",
            auth: 'token'
        }
    };
};

