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
var jwt = require('jsonwebtoken'),
    Boom = require('boom'),
    P = require('bluebird'),
    Calibrate = require('calibrate');

module.exports = function(server) {
    var Applications = server.plugins['covistra-security'].Applications.model;
    var config = server.plugins['hapi-config'].CurrentConfiguration;

    function handler(req, reply) {
        req.log.debug("Looking for application %s",req.headers['x-app-key']);
        return Applications.getByKey(req.headers['x-app-key']).then(function(app) {
            if(app) {
                req.log.debug("Application %s will be used to authenticate this request", app.name);
                var tokenOptions = config.get('plugins:security:token_options', { roles: ['covistra-security'], expiresIn: 30 * 24 * 60 * 60, audience: app.key, issuer: 'cmbf' });
                return P.promisify(jwt.verify, jwt)(req.params.token, app.secret, { audience: app.key, issuer: tokenOptions.issuer }).then(function(decoded){
                    req.log.debug("Token was successfully verified");
                    return {
                        valid: true,
                        profile: decoded
                    };
                }).catch(function(err) {
                    req.log.error(err);
                    throw Boom.unauthorized('invalid-token');
                });
            }
            else {
                req.log.error("application %s wasn't found", req.headers['x-app-key']);
                throw Boom.badRequest('invalid-app-key');
            }
        }).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'GET',
        path: '/auth/verify/{token}',
        handler: handler,
        config: {
            tags: ['api']
        }
    }
};