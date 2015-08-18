"use strict";

var Calibrate = require('calibrate'),
    Joi = require('joi');

module.exports = function(server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        return Applications.model.getByKey(req.params.key).then(function(application) {
            reply(application.toObject());
        }).catch(Calibrate.error);
    }

    return { method: 'GET', path: '/applications/{key}', handler: handler, config:{
        tags: ['api'],
        description: "Retrieve a specific application",
        validate:{
            params: {
                key: Joi.string().required()
            }
        }
    }};
};


