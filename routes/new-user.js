"use strict";

var Calibrate = require('calibrate'),
    Joi = require('joi'),
    _ = require('lodash');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users;

    function handler(req, reply) {
        req.log("Users:Route:newUsers", req.payload.username);
        req.payload.status = Users.Status.NEW;
        Users.model.create(req.payload).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'POST', path: '/users', handler: handler, config: {
            tags: ['api'],
            description: "Create a user in the system",
            validate: {
                payload: Joi.object().keys({
                    username: Joi.string().required(),
                    email: Joi.string().email().required(),
                    password: Joi.string().min(6).regex(/[a-zA-Z0-9]{6,30}/).required()
                })
            }
        }
    };
};

