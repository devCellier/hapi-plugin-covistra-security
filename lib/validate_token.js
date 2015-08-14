"use strict";
var jwt = require('jsonwebtoken'),
    P = require('bluebird');

module.exports = function(server, log, config) {

    var Tokens = server.plugins['covistra-security'].Tokens;

    return function(token, callback) {
        log.trace("Token authentication", token);
        return Tokens.model.loadToken(token).then(function(token) {
            if(token) {

                var issuer = config.get('plugins:security:token_infos:issuer', 'cmbf');

                // Validate signature using JWT
                return P.promisify(jwt.verify, jwt)(token.token.token, token.app.secret, { audience: token.app.key, issuer: issuer}).then(function(decoded) {

                    if(decoded) {

                        callback(null, true, {
                            emitter: token.emitter,
                            bearer: token.bearer,
                            application: token.app,
                            token: token,
                            profile: decoded
                        });
                    }
                    else {
                        return callback(null, false);
                    }
                });
            }
            else {
                callback(null, false);
            }

        }).catch(callback);
    }
};
