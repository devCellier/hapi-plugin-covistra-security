var Joi = require('joi');
var P = require('bluebird');
var _ = require('lodash');
var trim = require('trim');

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

                // Process coma-separated aspect list
                if(_.isString(msg.aspects)) {
                    msg.aspects = _.map(msg.aspects.split(','), function(aspect) { return trim(aspect.toLowerCase())});
                }

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
            aspects: Joi.array().items(Joi.string()).optional()
        }),
        route: {
            method: 'GET',
            path: '/tokens',
            validate: {
                query: {
                    app: Joi.string(),
                    bearer: Joi.string(),
                    emitter: Joi.string(),
                    aspects: Joi.string()
                }
            }
        },
        callback: service
    }
};
