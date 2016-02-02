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

var P = require('bluebird'),
    Calibrate = require('calibrate'),
    Joi = require('joi'),
    Boom = require('boom'),
    _ = require('lodash');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:deleteUsers", req.payload);

        if(_.contains(req.auth.credentials.token.roles, "admin") ) {
            return Users.model.delete(req.params.username).then(Calibrate.response).catch(Calibrate.error).then(reply);
        }

    }

    return {
        method: 'DELETE', path: '/users/{username}', handler: handler, config: {
            tags: ['api', 'restricted'],
            description: "Delete a user in the system. Limited to staff",
            auth: 'token'
        }
    };
};

