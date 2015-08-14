"use strict";

var P = require('bluebird'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    crypto = require('crypto');

module.exports = function(plugin) {

    var clock = plugin.plugins['covistra-system'].clock;
    var db = plugin.plugins['covistra-mongodb'].MAIN;
    var uniqueCheck = plugin.plugins['covistra-mongodb'].uniqueCheck;
    var TemplateEngine = plugin.plugins['covistra-system'].TemplateEngine;
    var Mailer = plugin.plugins['covistra-mailer'];

    if(Mailer) {
        TemplateEngine.registerTemplate('verify-email', fs.readFileSync(path.resolve(__dirname, "..", "templates", "verify-email.hbs"), "utf8"));
        TemplateEngine.registerTemplate('welcome-email', fs.readFileSync(path.resolve(__dirname, "..", "templates", "welcome-email.hbs"), "utf8"));
    }

    plugin.plugins['covistra-mongodb'].indexManager.registerIndex('MAIN', 'users', { username: 1});
    plugin.plugins['covistra-mongodb'].indexManager.registerIndex('MAIN', 'users', { email: 1});

    var STATUS_VALUES = {
        NEW:'NEW',
        PENDING_EMAIL_VERIFICATION:"PENDING_EMAIL_VERIFICATION",
        PENDING_APPROVAL: "PENDING_APPROVAL",
        PENDING_FIRST_LOGIN: "PENDING_FIRST_LOGIN",
        ACTIVE: "ACTIVE",
        SUSPENDED: "SUSPENDED",
        REVOKED: "REVOKED"
    };

    function _encryptPassword(password) {
        var sha1 = crypto.createHash("sha1");
        sha1.update(password);
        return sha1.digest('base64');
    }

    function User(data) {
        _.merge(this, data);

        this.image_url ="//www.gravatar.com/avatar/" + crypto.createHash('md5').update(this.email).digest('hex');
    }

    User.prototype.secure = function() {
        return _.pick(this, "username", "email", "status", "last_presence_ts", "first_name", "last_name", "_id");
    };

    User.prototype.update = function(data) {
        var _this = this;
        var coll = db.collection('users');
        _.merge(this, data);
        return P.promisify(coll.update, coll)({username: this.username}, {
            $set: data
        }).then(function() {
            return _this;
        });
    };

    User.prototype.delete = function() {
        var coll = db.collection('users');
        return P.promisify(coll.delete, coll)({username: this.username});
    };

    User.prototype.asReceipt = function() {
        return {
            username: this.username,
            status: this.status
        };
    };

    User.prototype.confirmEmail = function(options) {
        var _this = this;
        options = options || {};
        return this.update({status: STATUS_VALUES.PENDING_FIRST_LOGIN}).then(function(result) {
            if(options.notify && Mailer) {
                Mailer.sendRichEmailToUser('no-reply@lifepulz.com', _this, {
                    subject: 'Welcome to Lifepulz.com!',
                    template: 'welcome-email',
                    data: _this
                });
            }
            return result;
        });
    };

    function _getByUsername(username) {
        var coll = db.collection('users');
        return P.promisify(coll.findOne, coll)({username: username}).then(function(data) {
            if(data) {
                return new User(data);
            }
        });
    }

    function _findById(_id) {
        var coll = db.collection('users');
        return P.promisify(coll.findOne, coll)({_id: _id}).then(function(data) {
            if(data) {
                return new User(data);
            }
        });
    }

    function _create(data) {
        var coll = db.collection('users');

        if(data.status === STATUS_VALUES.NEW) {
            data.password =_encryptPassword(data.password);
            data.validation_code = crypto.randomBytes(10).toString('hex').toUpperCase();
            data.status = STATUS_VALUES.PENDING_EMAIL_VERIFICATION;
        }

        // Validate username and email uniqueness
        return uniqueCheck('users', {username: data.username, email: data.email}).then(function() {
            return P.promisify(coll.insertOne, coll)(data).then(function(result) {
                data._id = result._id;

                if(Mailer) {
                    Mailer.sendRichEmailToUser('no-reply@lifepulz.com', data, {
                        subject: 'Lifepulz.com: Email confirmation',
                        template: 'verify-email',
                        data: data
                    });
                }

                return new User(data).asReceipt();
            });
        });

    }

    function _list(filter, options) {
        options = options || {};
        var cursor = db.collection('users').find(filter);

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

    var _authenticate = function (request) {
        return _getByUsername(request.username).then(function(user) {
            if (user) {
                if (_encryptPassword(request.password) === user.password && _.contains([STATUS_VALUES.ACTIVE,STATUS_VALUES.PENDING_FIRST_LOGIN], user.status) ) {
                    return user.update({last_presence_ts: clock.nowTs(), status: STATUS_VALUES.ACTIVE }).then(function() {
                        return user;
                    });
                }
            }
        });
    };

    return {
        model: {
            authenticate: _authenticate,
            getByUsername: _getByUsername,
            create: _create,
            list: _list,
            findById: _findById
        },
        Status: STATUS_VALUES
    }
};