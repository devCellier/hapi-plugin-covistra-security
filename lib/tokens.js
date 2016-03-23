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
var P = require('bluebird'),
    _ = require('lodash'),
    Boom = require('boom'),
    jwt = require('jsonwebtoken');

module.exports = function(plugin, log, config) {

    var dbName = config.get('plugins:security:db_ref', 'MAIN');
    var db = plugin.plugins['covistra-mongodb'][dbName];
    var ObjectId = plugin.plugins['covistra-mongodb'].ObjectId;
    var clock = plugin.plugins['covistra-system'].clock;
    var Users = plugin.plugins['covistra-security'].Users;
    var Applications = plugin.plugins['covistra-security'].Applications;

    plugin.plugins['covistra-mongodb'].indexManager.registerIndex(dbName, 'tokens', {token:1});

    function Token(data) {
        _.merge(this, data);
    }

    Token.prototype.toJSON = function() {
        return _.omit(this);
    };

    function _create(data) {
        var coll = db.collection('tokens');
        return P.promisify(coll.insertOne, coll)(data).then(function(result) {
            data._id = result.insertedId;
            return new Token(data);
        });
    }

    function _loadToken(tokenString) {
        log.debug("Load token", tokenString);
        var coll = db.collection('tokens');
        return P.promisify(coll.findOne, coll)({token: tokenString}).then(function(token) {

            if(token) {
                // Load all token fields in parallel
                return P.props({
                    token: token,
                    emitter: Users.model.findById(token.emitter),
                    bearer: Users.model.findById(token.bearer),
                    app: Applications.model.findById(token.app)
                });
            }
            else {
                throw Boom.notFound("invalid token");
            }

        });

    }

    function _allocateToken(credentials, app, options) {
        log.debug("Allocating token for user %s and app %s for emitter %s", credentials.username, app.key, options.subject || credentials._id);

        // Make sure we have an expiration for our token. 1 hour by default
        options.expiresIn = options.expiresIn || 60 * 60;

        // Generate the JWT for subsequent API calls
        var token = jwt.sign({
            username: credentials.username,
            email: credentials.email,
            first_name: credentials.first_name,
            last_name: credentials.last_name,
            last_presence_ts: credentials.last_presence_ts,
            status: credentials.status,
            roles: options.groups || credentials.groups || []
        }, app.secret, _.omit(options, 'permissions', 'bearer', 'usageCount', 'parent', 'groups'));

        log.debug("Secure token %s was successfully allocated", token);

        return _create({
            token: token,
            bearer: options.bearer || credentials._id,
            emitter: options.subject || credentials._id,
            app: app._id,
            permissions: options.permissions || [],
            usage: options.usageCount,
            parent: options.parent,
            roles: options.groups || credentials.groups || [],
            ts: clock.nowTs(),
            expireTs: new Date(clock.nowTs() + options.expiresIn * 1000)
        });
    }

    function _listTokens(app, bearer, emitter) {
        var q = {
            expireTs: { $gte: new Date() }
        };

        if(app)  {
            q.app = ObjectId(app);
        }

        if(bearer) {
            q.bearer = ObjectId(bearer);
        }

        if(emitter) {
            q.emitter = ObjectId(emitter);
        }

        var coll = db.collection('tokens');
        var cursor = coll.find(q).limit(100);
        return P.promisify(cursor.toArray, cursor)();
    }

    return {
        model: {
            create: _create,
            loadToken: _loadToken,
            allocateToken: _allocateToken,
            listTokens: _listTokens
        }
    };

};
