var Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var Tokens = server.plugins['covistra-security'].Tokens;

    /**
     *
     */
    var service = function(msg) {
        return Tokens.model.allocateToken(msg.user, msg.app, msg.options);
    };

    return {
        pattern:{role:'security', target:'token', action:'create'},
        schema: Joi.object().keys({
            user: Joi.object(),
            app: Joi.object(),
            options: Joi.object()
        }),
        callback: service
    }
};
