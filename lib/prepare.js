const fs = require('fs');
const resolveConfig = require('./resolve-config');
const exec = require('./exec');

module.exports = async (pluginConfig, context) => {
    const {
        logger,
        nextRelease: {notes},
    } = context;
    const { prepareCmd } = resolveConfig(pluginConfig, context);

    if (prepareCmd === false) {
        logger.log('skip prepare command execute');
        return;
    }
    fs.writeFileSync('./buildResources/release-notes.md', notes);
    logger.log(`reelase note is \n${fs.readFileSync('./buildResources/release-notes.md')}`);
    await exec(prepareCmd ? prepareCmd:"npm run precompile", context);
}