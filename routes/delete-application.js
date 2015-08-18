"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:deleteApplications", req.payload);
        Applications.model.delete(req.params.key).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'DELETE', path: '/applications/{key}', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "Delete an application in the system. Limited to staff",
            auth: 'token'
        }
    };
};

