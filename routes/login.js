var Calibrate = require('calibrate'),
    _ = require('lodash'),
    Boom = require('boom');

module.exports = function(server) {

    var config = server.plugins['hapi-config'].CurrentConfiguration;

    var Users = server.plugins['covistra-security'].Users;
    var Tokens = server.plugins['covistra-security'].Tokens;
    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {

        var ctx = config.get('server:info') || { app_title: 'CMBF', app_name: 'cmbf'};

        if(req.method === 'get') {
            if (req.auth.isAuthenticated) {
                return reply.redirect('/');
            }
            else {
                reply.view('login', _.merge(ctx, {
                    target_url: req.query.next
                }));
            }
        }
        else {
            // Perform the authentication
            Users.model.authenticate({username: req.payload.username, password: req.payload.password}).then(function(user) {
                if(user) {

                    // Allocate an API token if requested
                    if(req.payload.allocate_api_token == true) {
                        req.log.debug("Allocating an API token as requested");
                        return Applications.model.getByKey(req.payload.app_key).then(function(app) {
                            if(app) {
                                req.log.debug("Loaded application", app.key);

                                var tokenOptions = config.get('plugins:security:token_options') || { roles: ['user'], expiresInMinutes: 30 * 24 * 60, audience: app.key, issuer: 'cmbf' }
                                tokenOptions.subject = user.username;

                                return Tokens.model.allocateToken(user, app, tokenOptions).then(function(tok) {
                                    req.log.debug("API Token %s was successfully allocated", tok.token);
                                    user.api_token = tok.token;
                                    req.auth.session.set(user);
                                    return reply.redirect(req.payload.target_url || '/');
                                });
                            }
                            else {
                                server.log(['plugin', 'user', 'error'], "Application not found..."+req.payload.app_key);
                                reply.view('login',  _.merge(ctx, {
                                    target_url: req.query.next,
                                    error: Boom.unauthorized()
                                }));
                            }
                        });
                    }
                    else {
                        req.auth.session.set(user);
                        return reply.redirect(req.payload.target_url || '/');
                    }
                }
                else {
                    server.log(['plugin', 'user', 'error'], "User not found...");
                    reply.view('login',  _.merge(ctx, {
                        target_url: req.query.next,
                        error: Boom.unauthorized()
                    }));
                }

            }).catch(function(err) {
                reply.view('login',  _.merge(ctx, {
                    target_url: req.query.next,
                    error: err
                }))
            });
        }
    }

    return {
        method: ['GET', 'POST'],
        path: '/login',
        handler: handler
    }
};
