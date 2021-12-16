const path = require('path');
const {stat, readFile} = require('fs-extra');
const {isPlainObject, template, pick} = require('lodash');
const mime = require('mime');
const debug = require('debug')('semantic-release:github');
const {RELEASE_NAME} = require('./definitions/constants');
const parseGithubUrl = require('./parse-github-url');
const globAssets = require('./glob-assets');
const resolveConfig = require('./resolve-config');
const getClient = require('./get-client');
const isPrerelease = require('./is-prerelease');
const exec = require('./exec');

module.exports = async (pluginConfig, context) => {
  const {
    cwd,
    options: { repositoryUrl },
    env,
    branch,
    nextRelease: {name, gitTag, notes, version},
    logger,
  } = context;
  const {githubToken, githubUrl, githubApiPathPrefix, proxy, assets, versionVariable, publishCmd} = resolveConfig(pluginConfig, context);
  const {owner, repo} = parseGithubUrl(repositoryUrl);
  const github = getClient({githubToken, githubUrl, githubApiPathPrefix, proxy});
  const release = {
    owner,
    repo,
    tag_name: gitTag,
    target_commitish: branch.name,
    name,
    body: notes,
    prerelease: isPrerelease(branch),
  };

    if (versionVariable === false) {
        logger.log('skip set version variable');
    } else {
        const v = versionVariable ? versionVariable: "VITE_APP_VERSION";
        env[v] = version;
        logger.log('set environment variable: [%s]:%s', v, env[v]);
    }

  if (publishCmd === false) {
    logger.log('skip publishCmd execute');
  } else {
    logger.log('publishCmd execute');
    await exec(publishCmd ? publishCmd:'npm run release -- -c.releaseInfo.releaseNotes=${nextRelease.notes}', context);
  }


  debug('release object: %O', release);

  const {html_url: url, upload_url: uploadUrl, id: releaseId  } = (await github.repos.listReleases(pick(release, ["owner", "repo"])))
      .data
      .find(x => x.tag_name === gitTag);

  logger.log('Get GitHub release: %s', url);

  if (assets && assets.length > 0) {  
    // Append assets to the release
    const globbedAssets = await globAssets(context, assets);
    debug('globed assets: %o', globbedAssets);
  
    await Promise.all(
      globbedAssets.map(async (asset) => {
        const filePath = isPlainObject(asset) ? asset.path : asset;
        let file;
  
        try {
          file = await stat(path.resolve(cwd, filePath));
        } catch {
          logger.error('The asset %s cannot be read, and will be ignored.', filePath);
          return;
        }
  
        if (!file || !file.isFile()) {
          logger.error('The asset %s is not a file, and will be ignored.', filePath);
          return;
        }
  
        const fileName = template(asset.name || path.basename(filePath))(context);
        const upload = {
          url: uploadUrl,
          data: await readFile(path.resolve(cwd, filePath)),
          name: fileName,
          headers: {
            'content-type': mime.getType(path.extname(fileName)) || 'text/plain',
            'content-length': file.size,
          },
        };
  
        debug('file path: %o', filePath);
        debug('file name: %o', fileName);
  
        if (isPlainObject(asset) && asset.label) {
          upload.label = template(asset.label)(context);
        }
  
        const {
          data: {browser_download_url: downloadUrl},
        } = await github.repos.uploadReleaseAsset(upload);
        logger.log('Published file %s', downloadUrl);
      })
    );
  }

  const {
    data: {html_url: publishedUrl},
  } = await github.repos.updateRelease({owner, repo, release_id: releaseId, name, body: notes,  draft: false});

  logger.log('Published GitHub release: %s', publishedUrl);
  return {publishedUrl, name: RELEASE_NAME, id: releaseId};
};
