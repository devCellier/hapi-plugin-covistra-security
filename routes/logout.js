var Calibrate = require('calibrate'),
    Boom = require('boom');

module.exports = function(server) {

    function handler(req, reply) {
        request.auth.session.clear();
        return reply.redirect('/');
    }

    return {
        method: 'GET',
        path: '/logout',
        handler: handler,
        config: {
            auth: 'session'
        }
    }
};
