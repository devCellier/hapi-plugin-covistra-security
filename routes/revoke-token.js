
module.exports = function(server) {
    var Tokens = server.plugins['covistra-security'].Tokens.model;

    function handler(req, reply) {
        if(req.auth.credentials.token) {
            Tokens.remove({token: req.auth.credentials.token.token}).then(function(){
                reply({success: true});
            }).catch(reply);
        }
    }

    return {
        method: 'DELETE',
        path: '/auth/token',
        handler: handler,
        config: {
            auth: 'token',
            tags: ['api']
        }
    }
};