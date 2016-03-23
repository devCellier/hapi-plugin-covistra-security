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
var Boom = require('boom'),
    Joi = require('joi'),
    Calibrate = require('calibrate');

module.exports = function(server, log, config) {
    var Tokens = server.plugins['covistra-security'].Tokens.model;
    var Applications = server.plugins['covistra-security'].Applications.model;

    function handler(req, reply) {
        req.log.debug("Trying to authenticate user %s with application %s", req.auth.credentials.username, req.headers["x-app-key"]);

        // Retrieve the application for which the token is created
        Applications.getByKey(req.headers["x-app-key"]).then(function(app) {
            if(app) {
                req.log.debug("Found app", app);

                var tokenOptions = config.get('plugins:security:token_options', { roles: ['covistra-security'], expiresInMinutes: 30 * 24 * 60, audience: app.key, issuer: 'cmbf' });
                tokenOptions.subject = req.auth.credentials._id;
                tokenOptions.audience = tokenOptions.audience || app.key;

                return Tokens.allocateToken(req.auth.credentials, app, tokenOptions ).then(function(tok) {
                    req.log.debug("Token was successfully allocated for user", req.auth.credentials);
                    return {token: tok.token};
                });

            }
            else {
                throw Boom.create(401, "Unknown app", { key: req.headers['x-app-key']});
            }
        }).then(Calibrate.response).catch(Calibrate.error).then(reply);

    }

    return {
        method: 'GET',
        path: '/auth/token',
        handler: handler,
        config: {
            tags: ['api', 'security'],
            auth: 'simple',
            validate: {
                headers: Joi.object({
                    'x-app-key': Joi.string().required().description('The App key for which the token will be created'),
                    'authorization': Joi.string().required().description('A standard HTTP BASIC Auth header value')
                }).unknown()
            }
        }
    };

};
