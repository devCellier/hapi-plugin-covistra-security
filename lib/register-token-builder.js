module.exports = function (server, tokenBuilderRegistry) {
    var log = server.plugins['covistra-system'].systemLog;

    return function (tokenBuilder) {
        log.info("Registering token builder %s", tokenBuilder.id);
        tokenBuilderRegistry.push(tokenBuilder);
    };

};
