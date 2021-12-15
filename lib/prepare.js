const path = require('path');
const {stat, readFile} = require('fs-extra');
const resolveConfig = require('./resolve-config');
const exec = require('./exec');

module.exports = async (pluginConfig, context) => {
    const {
        nextRelease: { name, gitTag, notes },
        logger,
        env
    } = context;
    const { versionVariable, prepareCmd } = resolveConfig(pluginConfig, context);

    if (versionVariable === false) {
        logger.log('skip set version variable');
    } else {
        const version = versionVariable ?? "VITE_APP_VERSION";
        env[version] = nextRelease.gitTag;
        logger.log('set environment variable: [%s]:%s', version, nextRelease.gitTag);
    }

    if (prepareCmd === false) {
        logger.log('skip prepare command execute');
        return;
    }
    await exec(prepareCmd ?? "npm run precompile", context);
}