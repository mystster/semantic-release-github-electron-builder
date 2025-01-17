const {template} = require('lodash');
const execa = require('execa');

module.exports = async (cmd, {cwd, env, stdout, stderr, logger, ...context}) => {
  const script = template(cmd)({...context});

  logger.log('Call script %s', script);

  const result = execa(script, {cwd, env});

  result.stdout.pipe(stdout, {end: false});
  result.stderr.pipe(stderr, {end: false});

  return (await result).stdout.trim();
};