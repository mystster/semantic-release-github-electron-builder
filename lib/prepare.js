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
    const { versionVariable } = resolveConfig(pluginConfig, context);

    if (prepareCmd === false) {
        logger.log('skip prepare command execute');
        return;
    }
    await exec(prepareCmd ?? "npm run precompile", context);
}