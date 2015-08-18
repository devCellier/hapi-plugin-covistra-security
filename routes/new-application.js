"use strict";

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:newApplications", req.params);
        Applications.model.create(req.payload).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'POST', path: '/applications', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "Create an application in the system. Limited to staff",
            auth: 'token'
        }
    };
};

