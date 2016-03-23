var Joi = require('joi');
var P = require('bluebird');
var _ = require('lodash');

module.exports = function(server) {
    "use strict";

    var Tokens = server.plugins['covistra-security'].Tokens;
    var Users = server.plugins['covistra-security'].Users;
    var Applications = server.plugins['covistra-security'].Applications;

    /**
     *
     */
    var service = function(msg) {

        return Tokens.model.listTokens(msg.app, msg.bearer, msg.emitter).then(function(tokens) {

            if(msg.aspects) {

                return P.map(tokens, function(token) {
                    if(msg.aspects.indexOf('bearer') !== -1) {
                        token.bearer = Users.model.findById(token.bearer).then(function(user) {
                            return user.toJSON();
                        });
                    }

                    if(msg.aspects.indexOf('emitter') !== -1) {
                        token.emitter = Users.model.findById(token.emitter).then(function(user) {
                            return user.toJSON();
                        });
                    }

                    if(msg.aspects.indexOf('application') !== -1) {
                        token.app = Applications.model.getByKey(token.app).then(function(app) {
                            return app.toJSON();
                        });
                    }

                    return P.props(token);
                });
            }
            else {
                return tokens;
            }

        });

    };

    return {
        pattern:{role:'security', target:'token', action:'list'},
        schema: Joi.object().keys({
            app: Joi.string().description('List tokens for a specific app only. App key should be provided.'),
            bearer: Joi.string(),
            emitter: Joi.string(),
            aspects: Joi.array().items(Joi.string()).optional().description('Supported aspects: bearer,application,emitter')
        }),
        callback: service
    }
};
