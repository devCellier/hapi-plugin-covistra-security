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
    _ = require('lodash');

module.exports = function(plugin, log, config) {
    var dbName = config.get('plugins:security:db_ref', 'MAIN');
    var db = plugin.plugins['covistra-mongodb'][dbName];

    plugin.plugins['covistra-mongodb'].indexManager.registerIndex(dbName, 'groups', {name:1});

    function Group(data) {
        _.merge(this, data);
    }

    Group.create = function(data) {
        var coll = db.collection('groups');

        return P.promisify(coll.insertOne, coll)(data).then(function(result){
            data._id = result._id;
            return new Group(data);
        });
    };

    Group.list = function(filter, options) {
        options = options || {};
        var cursor = db.collection('groups').find(filter);

        if(options.limit) {
            cursor.limit(options.limit);
        }

        if(options.skip) {
            cursor.skip(options.skip);
        }

        if(options.sort) {
            cursor.sort(options.sort);
        }
        return P.promisify(cursor.toArray, cursor)();
    };

    Group.getByKey = function(key) {
        var coll = db.collection('groups');
        return P.promisify(coll.findOne, coll)({name: name}).then(function(data){
            return new Group(data);
        });
    };

    Group.prototype.update = function(data) {
        var _this = this;
        var coll = db.collection('groups');
        _.merge(this, data);
        return P.promisify(coll.update, coll)({key: this.key}, {
            $set: data
        }).then(function() {
            return _this;
        });
    };

    Group.prototype.delete = function() {
        var coll = db.collection('groups');
        return P.promisify(coll.delete, coll)({key: this.key});
    };

    return {
        model: Group
    }
};
