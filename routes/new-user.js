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
    Joi = require('joi'),
    _ = require('lodash');

module.exports = function (server) {

    var Users = server.plugins['covistra-security'].Users;

    function handler(req, reply) {
        req.log("Users:Route:newUsers", req.payload.username);
        req.payload.status = Users.Status.NEW;
        Users.model.create(req.payload).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'POST', path: '/users', handler: handler, config: {
            tags: ['api'],
            description: "Create a user in the system",
            validate: {
                payload: Joi.object().keys({
                    username: Joi.string().required(),
                    email: Joi.string().email().required(),
                    password: Joi.string().min(6).regex(/[a-zA-Z0-9]{6,30}/).required(),
                    lang: Joi.string().allow('').optional().default('en'),
                    phone: Joi.string(),
                    first_name: Joi.string(),
                    last_name: Joi.string(),
                    welcome_email: Joi.string(),
                    opt_in: Joi.boolean().default(true)
                })
            }
        }
    };
};

