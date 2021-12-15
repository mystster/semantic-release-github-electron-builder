const path = require('path');
const {stat, readFile} = require('fs-extra');
const resolveConfig = require('./resolve-config');
const exec = require('./exec');

module.exports = async (pluginConfig, context) => {
    const {
        nextRelease: { version },
        logger,
        env
    } = context;
    const { versionVariable, prepareCmd } = resolveConfig(pluginConfig, context);

    if (versionVariable === false) {
        logger.log('skip set version variable');
    } else {
        const v = versionVariable ? versionVariable: "VITE_APP_VERSION";
        env[v] = version;
        logger.log('set environment variable: [%s]:%s', v, env[v]);
    }

    if (prepareCmd === false) {
        logger.log('skip prepare command execute');
        return;
    }
    await exec(prepareCmd ? prepareCmd:"npm run precompile", context);
}