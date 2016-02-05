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
    Calibrate = require('calibrate');

module.exports = function(server, log, config) {
    "use strict";

    var Tokens = server.plugins['covistra-security'].Tokens.model;
    var Applications = server.plugins['covistra-security'].Applications.model;

    function _computeExpiration(expirationSpec, defaultExpiresInSecond) {
        if(expirationSpec && expirationSpec.type === 'time') {
            return expirationSpec.expiration;
        }
        return defaultExpiresInSecond;
    }

    function _computeUsage(expirationSpec) {
        if(expirationSpec && expirationSpec.type === 'usage') {
            return expirationSpec.count;
        }
    }

    function handler(req, reply) {

        var tokenOptions = config.get('plugins:security:token_options', { groups: [], expiresIn: 30 * 24 * 60 * 60, audience: req.auth.credentials.application.key, issuer: 'cmbf' });

        tokenOptions.groups = req.payload.groups;
        tokenOptions.expiresIn = _computeExpiration(req.payload.expiration, tokenOptions.expiresIn);
        tokenOptions.audience = req.auth.credentials.application.key;
        tokenOptions.permissions = req.payload.permissions;
        tokenOptions.usageCount =_computeUsage(req.payload.expiration);
        tokenOptions.parent = req.auth.credentials.token.token;

        // Only admin can create a token for someone else without his acknowledgement
        if(_.contains(req.auth.credentials.token.token.roles, "admin")) {
            tokenOptions.subject = req.payload.emitter || req.auth.credentials.emitter.username;
            tokenOptions.bearer = req.payload.bearer || req.auth.credentials.bearer;
        }
        else {
            tokenOptions.subject = req.auth.credentials.emitter.username;
            tokenOptions.bearer = req.payload.bearer;
        }

        return Tokens.allocateToken(req.auth.credentials.emitter, req.auth.credentials.application, tokenOptions ).then(function(tok) {
            req.log.debug("Token was successfully allocated for user", req.auth.credentials.emitter.username);
            return {token: tok.token};
        }).then(Calibrate.response).catch(Calibrate.error).then(reply);

    }

    return {
        method: 'POST',
        path: '/tokens',
        handler: handler,
        config: {
            tags: ['api'],
            auth: 'token'
        }
    };

};
