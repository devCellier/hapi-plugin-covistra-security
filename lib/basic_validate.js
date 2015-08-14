"use strict";

module.exports = function(server, log) {

    var Users = server.plugins['covistra-security'].Users;

    return function (username, password, callback) {
        log.trace("Authenticating user Basic:", username);
        return Users.model.authenticate({username: username, password:password}).then(function(user) {
            if(!user) {
                log.error("User %s cannot be authenticated", username);
                return callback(null, false);
            }

            return callback(null, true, user.secure() );
        }).catch(callback);
    };
}
