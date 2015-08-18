"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:editApplications", req.payload);
        Applications.model.update(req.params.key, req.payload).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'PUT', path: '/applications/{key}', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "Edit an application in the system. Limited to staff",
            auth: 'token'
        }
    };
};

