var Boom = require('boom'),
    Calibrate = require('calibrate');

module.exports = function(server) {
    var Tokens = server.plugins['covistra-security'].Tokens.model;
    var Applications = server.plugins['covistra-security'].Applications.model;

    function handler(req, reply) {
        req.log.debug("Trying to authenticate user %s with application %s", req.auth.credentials.username, req.headers["x-app-key"]);

        // Retrieve the application for which the token is created
        Applications.getByKey(req.headers["x-app-key"]).then(function(app) {
            if(app) {
                req.log.debug("Found app", app);

                var tokenOptions = config.get('plugins:security:token_options', { roles: ['covistra-security'], expiresInMinutes: 30 * 24 * 60, audience: app.key, issuer: 'cmbf' });
                tokenOptions.subject = req.auth.credentials.username;
                return Tokens.allocateToken(req.auth.credentials, app, tokenOptions ).then(function(tok) {
                    req.log.debug("Token was successfully allocated for user", req.auth.credentials);
                    return {token: tok.token};
                });

            }
            else {
                throw Boom.create(401, "Unknown app", { key: req.headers['x-app-key']});
            }
        }).then(Calibrate.response).catch(Calibrate.error).then(reply);

    }

    return {
        method: 'GET',
        path: '/auth/token',
        handler: handler,
        config: {
            tags: ['api'],
            auth: 'simple'
        }
    };

};
