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
    Joi = require('joi');

module.exports = function(server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        return Applications.model.getByKey(req.params.key).then(function(application) {
            reply(application.toObject());
        }).catch(Calibrate.error);
    }

    return { method: 'GET', path: '/applications/{key}', handler: handler, config:{
        tags: ['api'],
        description: "Retrieve a specific application",
        validate:{
            params: {
                key: Joi.string().required()
            }
        }
    }};
};


