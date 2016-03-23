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

module.exports = function (server) {

    var Applications = server.plugins['covistra-security'].Applications;

    function handler(req, reply) {
        server.log(['plugin', 'users', 'debug'], "Users:Route:newApplications", req.params);
        Applications.model.create(req.payload).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'POST', path: '/applications', handler: handler, config: {
            tags: ['api', 'security'],
            description: "Create an application in the system. Limited to staff",
            auth: 'token',
            validate: {
                headers: Joi.object({
                    'authorization': Joi.string().required().description('A Bearer token value')
                }).unknown()
            }
        }
    };
};

