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
"use strict";
var jwt = require('jsonwebtoken'),
    Boom = require('boom'),
    P = require('bluebird');

module.exports = function(server, log, config, tokenBuilders) {

    var Tokens = server.plugins['covistra-security'].Tokens;

    return function(token, callback) {
        log.trace("Token authentication", token);
        return Tokens.model.loadToken(token).then(function(token) {
            if(token) {

                var issuer = config.get('plugins:security:token_options:issuer', 'cmbf');

                // Validate signature using JWT
                return P.promisify(jwt.verify, jwt)(token.token.token, token.app.secret, { audience: token.app.key, issuer: issuer}).then(function(decoded) {

                    if (decoded) {

                        var tok = {
                            emitter: token.emitter,
                            bearer: token.bearer,
                            application: token.app,
                            token: token,
                            profile: decoded
                        };

                        // Execute all token builders to add properties
                        return P.each(tokenBuilders || [], function (builder) {
                            return builder.buildToken(tok);
                        }).then(function () {
                            log.trace("Waiting for all promises to resolve", tok);
                            return P.props(tok).then(function (built_token) {
                                log.trace("Resolved token:", built_token);
                                callback(null, true, built_token);
                            });
                        });
                    }
                    else {
                        return callback(null, false);
                    }
                }).catch(function() {
                    throw new Boom.badRequest("invalid-token");
                });
            }
            else {
                callback(null, false);
            }

        }).catch(callback);
    }
};
