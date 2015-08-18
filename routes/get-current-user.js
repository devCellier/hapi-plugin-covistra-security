"use strict";

var Calibrate = require('calibrate');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users.model;

    function handler(req, reply) {
        return Users.getByUsername(req.auth.credentials.bearer.username).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'GET', path: '/user', handler: handler, config: {
            auth: 'token',
            tags: ['api'],
            description: "Get the full profile of the current user",
            notes: "Current user is determine by the token (bearer)"
        }
    };
};

