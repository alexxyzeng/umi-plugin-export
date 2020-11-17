const chokidar = require('chokidar');
const log = console.log;
const process = require('process');
const path = require('path');
const { throttle } = require('./throttle');
const childProcess = require('child_process');

const defaultOptions = {
  match: /(components|enum|service|utils|helpers)/g,
  ignored: /(node_modules|.git|.umi|package.json|.umirc|test|jest|__test__|.prettier|.fatherrc|yarn|npm|.DS_Store|.editorconfig|.md|(\/(components|utils|helpers|enums)\/index.js))/g,
  outputPath: 'index.js',
};

let pathsToParse = {};

function generateExport(type, matchPattern, outputPath, api) {
  api.log.pending('Pending parsing export');
  const paths = Object.keys(pathsToParse);
  paths.forEach(dirPath => {
    const fullPath = path.resolve(process.cwd(), dirPath);
    childProcess.execSync(`generate-export ${fullPath} ${outputPath}`, {
      cwd: dirPath,
    });
    // const pathList = fullPath.split('/');
    // const parentPath = pathList.slice(0, pathList.length - 1).join('/');
    // if (!parentPath.match(matchPattern)) {
    //   return;
    // }
    // childProcess.execSync(`generate-export ${parentPath} ${outputPath}`, {
    //   cwd: dirPath,
    // });
  });
  api.log.success('Successfully generated');
}

const debouncedGenerateExport = generateExport;

function parseExport(targetPath = '', type, matchPattern, outputPath, api) {
  pathsToParse = {};
  const match = targetPath.match(matchPattern);
  if (!match) {
    return;
  }

  // const dirPath = path.resolve(
  //   process.cwd(),
  //   targetPath.slice(0, index + matchedPath.length),
  // );
  const pathList = targetPath.split('/');
  const fileName = pathList[pathList.length - 1];
  const fileLevel =
    fileName === outputPath ? pathList.length - 2 : pathList.length - 1;
  const dirPath = pathList.slice(0, fileLevel).join('/');
  if (!pathsToParse[dirPath]) {
    pathsToParse[dirPath] = 1;
  }
  debouncedGenerateExport(type, matchPattern, outputPath, api);
}

export default function(api, options) {
  const { match, outputPath, ignored } = { ...defaultOptions, ...options };
  const watcher = chokidar.watch('.', {
    ignored,
    persistent: true,
  });
  api.onStart(() => {
    watcher
      // .on('add', path => parseExport(path, 'add', match, outputPath, api))
      .on('change', path => parseExport(path, 'change', match, outputPath, api))
      .on('unlink', path =>
        parseExport(path, 'remove', match, outputPath, api),
      );
  });
  api.onExit(() => {
    watcher.close().then(() => console.log('closed'));
  });
}
