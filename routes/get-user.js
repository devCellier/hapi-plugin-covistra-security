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

var Calibrate = require('calibrate'),
    _ = require('lodash'),
    Joi = require('joi');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users.model;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:getUser", req.params);
        if(req.params.username === 'me') {
            return Users.getByUsername(req.auth.credentials.bearer.username).then(function(user) {
              reply(_.omit(user, "password", "confirm_secret"));
            }).catch(Calibrate.error);
        }
        else {
            return Users.getByUsername(req.params.username).then(function(user) {
                reply(user.toJSON());
            }).catch(Calibrate.error);
        }
    }

    return {
        method: 'GET', path: '/users/{username}', handler: handler, config: {
            description: "Get public information about any member",
            notes: "This method return a subset of the user information",
            tags: ['api','security'],
            auth: 'token',
            validate: {
                params: {
                    username: Joi.string().required()
                },
                headers: Joi.object({
                    'authorization': Joi.string().required().description('A Bearer token value')
                }).unknown()
            },
            response: {
                schema: {
                    id: Joi.string(),
                    username: Joi.string(),
                    email: Joi.string(),
                    first_name: Joi.string(),
                    last_name: Joi.string(),
                    groups: Joi.array(),
                    last_presence_ts: Joi.any(),
                    phone: Joi.string(),
                    registered_on: Joi.date(),
                    roles: Joi.array(),
                    status: Joi.string(),
                    opt_in: Joi.boolean(),
                    created_ts: Joi.date()
                }
            }
        }
    };

};

