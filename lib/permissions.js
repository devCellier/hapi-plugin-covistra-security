var P = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto');

module.exports = function(server) {

	var clock = server.plugins['covistra-system'].clock;
	var db = server.plugins['covistra-mongodb'].MAIN;

	// Make sure our indexes are present in the database
	server.plugins['covistra-mongodb'].indexManager.registerIndex('MAIN', 'permissions', { key: 1});

	function Permission(data) {
		_.merge(this, data);
	}

	function _create(data) {
		var coll = db.collection('permissions');

		return P.promisify(coll.insertOne, coll)(data).then(function(result){
			data._id = result._id;
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

