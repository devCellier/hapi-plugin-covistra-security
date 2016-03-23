/**

 Copyright 2015 Covistra Technologies Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var _ = require('lodash'),
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
            req.log.debug("Authenticating user %s", req.payload.username);
            // Perform the authentication
            Users.model.authenticate({username: req.payload.username, password: req.payload.password}).then(function(user) {
                if(user) {

                    // Allocate an API token if requested
                    if(req.payload.allocate_api_token == true) {
                        req.log.debug("Allocating an API token as requested");
                        return Applications.model.getByKey(req.payload.app_key).then(function(app) {
                            if(app) {
                                req.log.debug("Loaded application", app.key);

                                var tokenOptions = config.get('plugins:security:token_options') || { roles: ['covistra-security'], expiresInMinutes: 30 * 24 * 60, audience: app.key, issuer: 'cmbf' }
                                tokenOptions.subject = user.username;
                                tokenOptions.audience = tokenOptions.audience || app.key;

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
