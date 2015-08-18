"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:getApplications", req.params);
        Applications.model.list().then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'GET', path: '/applications', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "List all applications in the system. Limited to staff",
            auth: 'token'
        }
    };
};

