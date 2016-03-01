var Joi = require('joi'),
    Boom = require('boom');

module.exports = function(server,config,log) {
    "use strict";

    var random = server.plugins['covistra-system'].random;

    /**
     *
     */
    var service = function(msg) {
        log.debug("Authenticating user %s", msg.credentials.username);

        // Perform the authentication
        return server.service({role:'security', target:'user', action:'authenticate', credentials: msg.credentials}).then(function(user) {
            var session = {};

            if(user) {

                session.id = random.id();
                session.user = user;

                // Allocate an API token if requested
                if(msg.options.allocate_api_token) {
                    log.debug("Allocating an API token as requested");
                    return server.service({role:'security', target:'application', action:'load', app: msg.options.app_key}).then(function(app) {
                        if(app) {
                            log.debug("Loaded application", app.key);

                            var tokenOptions = msg.options.tokenOpts;
                            if(!tokenOptions) {
                                tokenOptions = config.get('plugins:security:token_options') || { roles: ['user'], expiresInMinutes: 30 * 24 * 60, audience: app.key, issuer: 'cmbf' }
                            }

                            tokenOptions.subject = user.username;
                            tokenOptions.audience = tokenOptions.audience || app.key;

                            return server.service({role:'security', target:'token', action:'create', user: user, app: app, options: tokenOptions}).then(function(tok) {
                                log.debug("API Token %s was successfully allocated", tok.token);
                                session.api_token = tok.token;
                                return session;
                            });
                        }
                        else {
                            throw Boom.notFound('application:'+msg.options.app_key);
                        }
                    });
                }
                else {
                    return session;
                }
            }
            else {
                throw Boom.forbidden();
            }
        });
    };

    return {
        pattern:{role:'security', target:'session', action:'create'},
        schema: Joi.object().keys({
            credentials: Joi.object().keys({
                username: Joi.string().required(),
                password: Joi.string().required()
            }),
            options: {
                allocate_api_token: Joi.boolean().default(true),
                app_key: Joi.string(),
                tokenOpts: Joi.object().keys({
                    roles: Joi.array().items(Joi.string()),
                    expiresInMinutes: Joi.number().default(30 * 24 * 60)
                })
            }
        }),
        callback: service
    }
};
