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
var jwt = require('jsonwebtoken');

module.exports = function(server) {
    var Applications = server.plugins['covistra-security'].Applications.model;
    var config = server.plugins['hapi-config'].CurrentConfiguration;

    function handler(req, reply) {
        req.log.debug("Looking for application %s",req.headers['x-app-key']);
        Applications.findOne({key: req.headers['x-app-key']}, function(err, app) {
            if(err) {
                reply({valid: false, reason: err});
            }
            else if(app) {
                config =
                jwt.verify(req.params.token, app.secret, { audience: app.key, issuer: 'cellars.io'}, function(err, decoded) {
                    if(err) {
                        return reply({valid: false, reason: err});
                    }
                    else {
                        reply({valid: true, profile:decoded});
                    }
                });
            }
            else {
                reply({valid: false, reason: 'invalid-app-key'});
            }
        });
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