var jwt = require('jsonwebtoken');

module.exports = function(server) {
    var Applications = server.plugins['covistra-security'].Applications.model;
    var config = server.plugins['hapi-config'].CurrentConfiguration;

    function handler(req, reply) {
        req.log.debug("Looking for application %s",req.headers['x-app-key']);
        Applications.findOne({key: req.headers['x-app-key']}, function(err, app) {
            if(err) {
                reply({valid: false, reason: err});
            }
            else if(app) {
                config =
                jwt.verify(req.params.token, app.secret, { audience: app.key, issuer: 'cellars.io'}, function(err, decoded) {
                    if(err) {
                        return reply({valid: false, reason: err});
                    }
                    else {
                        reply({valid: true, profile:decoded});
                    }
                });
            }
            else {
                reply({valid: false, reason: 'invalid-app-key'});
            }
        });
    }

    return {
        method: 'GET',
        path: '/auth/verify/{token}',
        handler: handler,
        config: {
            tags: ['api']
        }
    }
};