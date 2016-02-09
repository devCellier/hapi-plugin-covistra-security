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

module.exports = function(server, log, config) {

	var dbName = config.get('plugins:security:db_ref', 'MAIN');
	var db = server.plugins['covistra-mongodb'][dbName];
	var clock = server.plugins['covistra-system'].clock;

	// Make sure our indexes are present in the database
	server.plugins['covistra-mongodb'].indexManager.registerIndex(dbName, 'permissions', { key: 1});

	function Permission(data) {
		_.merge(this, data);
	}

	function _create(data) {
		var coll = db.collection('permissions');

		return P.promisify(coll.insertOne, coll)(data).then(function(result){
			data._id = result.insertedId;
			return new Permission(data);
		});
	}

	function _list(filter, options) {
		options = options || {};
		var cursor = db.collection('permissions').find(filter);

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
	}

	function _getByKey(key) {
		var coll = db.collection('permissions');
		return P.promisify(coll.findOne, coll)({key: key}).then(function(data){
			return new Permission(data);
		});
	}

	function _findById(_id) {
		var coll = db.collection('permissions');
		return P.promisify(coll.findOne, coll)({_id: _id}).then(function(data) {
			if(data) {
				return new Permission(data);
			}
		});
	}

	Application.prototype.update = function(data) {
		var _this = this;
		var coll = db.collection('permissions');
		_.merge(this, data);
		return P.promisify(coll.update, coll)({key: this.key}, {
			$set: data
		}).then(function() {
			return _this;
		});
	};

	Application.prototype.delete = function() {
		var coll = db.collection('permissions');
		return P.promisify(coll.delete, coll)({key: this.key});
	};

	return {
		model: {
			create: _create,
			findById: _findById,
			list: _list,
			getByKey: _getByKey
		}
	}
};

