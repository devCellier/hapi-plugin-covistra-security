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

var Joi = require('joi'),
    Calibrate = require('calibrate'),
    trim = require('trim'),
    _ = require('lodash');

module.exports = function (server, log, config) {

    function handler(req, reply) {
        var msg = _.assign({role:'security', target:'token', action:'list'}, req.query);

        // Apply default parameters
        if(!msg.bearer && !msg.emitter) {
            msg.bearer = req.auth.credentials.bearer._id.toString();
        }

        if(!msg.app) {
            msg.app = req.auth.credentials.application._id.toString();
        }

        if(msg.aspects) {

            // Process coma-separated aspect list
            if(_.isString(msg.aspects)) {
                msg.aspects = _.map(msg.aspects.split(','), function(aspect) { return trim(aspect.toLowerCase())});
            }

        }

        return server.cmbf.service(msg).then(Calibrate.response).catch(Calibrate.error).then(reply);
    }

    return {
        method: 'GET',
        path: '/tokens',
        handler: handler,
        config:{
            tags: ['api', 'security'],
            auth: 'token',
            description: 'List Tokens',
            validate: {
                query: {
                    app: Joi.string(),
                    bearer: Joi.string(),
                    emitter: Joi.string(),
                    aspects: Joi.string()
                },
                headers: Joi.object({
                    'authorization': Joi.string().required()
                }).unknown()
            }
        }
    };
};

