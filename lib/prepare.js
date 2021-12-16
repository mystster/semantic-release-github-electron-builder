const resolveConfig = require('./resolve-config');
const exec = require('./exec');

module.exports = async (pluginConfig, context) => {
    const {
        logger,
    } = context;
    const { prepareCmd } = resolveConfig(pluginConfig, context);

    if (prepareCmd === false) {
        logger.log('skip prepare command execute');
        return;
    }
    await exec(prepareCmd ? prepareCmd:"npm run precompile", context);
}