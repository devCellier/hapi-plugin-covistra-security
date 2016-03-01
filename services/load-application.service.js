var Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var Applications = server.services['covistra-security'].Applications;

    /**
     *
     */
    var service = function(msg) {
        return Applications.model.getByKey(msg.app);
    };

    return {
        pattern:{role:'security', target:'application', action:'load'},
        schema: Joi.object().keys({
            app: Joi.string().description('Unique application key')
        }),
        callback: service
    }
};
