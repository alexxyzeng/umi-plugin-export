const chokidar = require('chokidar')
const log = console.log
const process = require('process')
const path = require('path')
const { throttle } = require('./throttle')
const childProcess = require('child_process')

const defaultOptions = {
  match: /(components|enum|service|utils|helpers)/,
  outputPath: 'index.js'
}

let pathsToParse = {}

function generateExport(outputPath, api) {
  api.log.pending('Pending parsing export')
  const paths = Object.keys(pathsToParse)
  // watcher.close()
  paths.forEach(dirPath => {
    childProcess.execSync(`generate-export ${dirPath} ${outputPath}`, { cwd: dirPath })
  })
  api.log.success('Successfully generated')
}

const debouncedGenerateExport = throttle(generateExport, 2000)


function parseExport(targetPath = '', type, matchPattern, outputPath, api) {

  const match = targetPath.match(matchPattern)
  if (!match) {
    return
  }
  const matchedPath = match[0]
  const index = match.index

  const dirPath = path.resolve(process.cwd(), targetPath.slice(0, index + matchedPath.length))
  if (!pathsToParse[dirPath]) {
    pathsToParse[dirPath] = 1
  }
  debouncedGenerateExport(outputPath, api)
}

export default function (api, options) {
  const { match, outputPath } = { ...defaultOptions, ...options }
  const watcher = chokidar.watch('.', {
    ignored: /(node_modules|.git|.umi|package.json|.umirc|test|jest|__test__|.prettier|.fatherrc|yarn|npm|.DS_Store|.editorconfig|.md|(\/(components|utils|helpers|enums)\/index.js))/g, // ignore dotfiles
    persistent: true
  });
  api.onStart(() => {
    watcher
      .on('add', path => parseExport(path, 'add', match, outputPath, api))
      .on('change', path => parseExport(path, 'change', match, outputPath, api))
      .on('unlink', path => parseExport(path, 'remove', match, outputPath, api));
  })
  api.onExit(() => {
    watcher.close().then(() => console.log('closed'));
  })
}

