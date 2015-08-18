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

    var Users = server.plugins['covistra-security'].Users.model;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:editUsers", req.payload);

        if(req.auth.credentials.emitter.username === req.params.username || _.contains(req.auth.credentials.token.scope, "group:admin") ) {
            Users.model.update(req.params.username, req.payload).then(Calibrate.response).catch(Calibrate.error).then(reply);
        }
        else {
            reply(new Error("not-enough-permissions")).statusCode(403);
        }

    }

    return {
        method: 'PUT', path: '/users/{username}', handler: handler, config: {
            tags: ['api'],
            description: "Edit a user in the system",
            auth: 'token',
            validate: {
                payload: Joi.object().keys({
                    email : Joi.string().email(),
                    first_name : Joi.string(),
                    last_name : Joi.string(),
                    groups : Joi.array().items(Joi.string()),
                    opt_in : Joi.boolean(),
                    phone : Joi.string(),
                    status : Joi.string().allow('ACTIVE', 'INACTIVE'),
                    medias: Joi.array().items(Joi.string()).description('An array of Cloudinary public_id associated with this user account')
                })
            }
        }
    };
};

