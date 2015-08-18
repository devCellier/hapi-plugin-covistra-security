"use strict";

var Calibrate = require('calibrate'),
    Joi = require('joi');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users.model;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:getUser", req.params);
        if(req.params.username === 'me') {
            return Users.getByUsername(req.auth.credentials.bearer.username).then(function(user) {
              reply(user.toJSON());
            }).catch(Calibrate.error);
        }
        else {
            return Users.getByUsername(req.params.username).then(function(user) {
                reply(user.toJSON());
            }).catch(Calibrate.error);
        }
    }

    return {
        method: 'GET', path: '/users/{username}', handler: handler, config: {
            description: "Get public information about any member",
            notes: "This method return a subset of the user information",
            tags: ['api'],
            auth: 'token',
            validate: {
                params: {
                    username: Joi.string().required()
                }
            },
            response: {
                schema: {
                    id: Joi.string(),
                    username: Joi.string(),
                    email: Joi.string(),
                    first_name: Joi.string(),
                    last_name: Joi.string(),
                    groups: Joi.array(),
                    last_presence_ts: Joi.any(),
                    phone: Joi.string(),
                    registered_on: Joi.date(),
                    roles: Joi.array(),
                    status: Joi.string(),
                    opt_in: Joi.boolean(),
                    created_ts: Joi.date()
                }
            }
        }
    };

};

