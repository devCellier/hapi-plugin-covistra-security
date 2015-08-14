var P = require('bluebird'),
    _ = require('lodash');

module.exports = function(plugin) {
    var db = plugin.plugins['covistra-mongodb'].MAIN;

    plugin.plugins['covistra-mongodb'].indexManager.registerIndex('MAIN', 'groups', {name:1});

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
