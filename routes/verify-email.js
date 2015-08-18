var Boom = require('boom'),
    Calibrate = require('calibrate'),
    Joi = require('joi');

module.exports = function(server) {

    var Users = server.plugins['covistra-security'].Users;

    function handler(req, reply) {
        req.log.debug("Verify user %s email", req.params.username);

        Users.model.getByUsername(req.params.username).then(function(user) {
            if(user) {
                if(user.validation_code === req.params.validation_code) {

                    if(user.status === Users.Status.PENDING_EMAIL_VERIFICATION) {

                        return user.confirmEmail({notify: true}).then(function() {
                            return { email_confirmed: true, status: Users.Status.PENDING_FIRST_LOGIN };
                        });
                    }
                    else {
                        throw Boom.badRequest('email has already been validated');
                    }
                }
                else {
                    throw Boom.forbidden('invalid validation_code');
                }

            }
            else {
                throw Boom.notFound('Unknown user:'+req.params.username);
            }

        }).then(Calibrate.response).catch(Calibrate.error).then(reply);

    }

    return {
        method: 'GET',
        path: '/verify/{username}/{validation_code}',
        handler: handler,
        config: {
            tags: ['api'],
            validate: {
                params: {
                    username: Joi.string().required(),
                    validation_code: Joi.string().required()
                }
            }
        }
    }

};
