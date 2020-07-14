
const chokidar = require('chokidar')
const log = console.log
const process = require('process')
const path = require('path')
const { throttle } = require('./throttle')
const childProcess = require('child_process')

const defaultOptions = {
  match: /\/(components|enum|service|utils|helpers)/,
  outputPath: 'index.js'
}

let pathsToParse = {}

function generateExport(outputPath, watcher) {
  const paths = Object.keys(pathsToParse)
  console.log(paths, '---- paths')
  watcher.close()
  try {
    paths.forEach(dirPath => {
      const finalPath = path.resolve(dirPath, outputPath)
      console.log(dirPath, '---- final path ---', outputPath, finalPath)
      childProcess.execSync('npx generate-export', [dirPath, outputPath])
    })
  } catch (err) {
    // console.log(err, '---- err')
  }
}

const debouncedGenerateExport = throttle(generateExport, 200)


function parseExport(targetPath = '', type, matchPattern, outputPath, watcher) {
  const match = targetPath.match(matchPattern)
  if (!match) {
    return
  }
  const matchedPath = match[0]
  const index = match.index

  // const dirPath = process.cwd() + '/' + path.slice(0, index + matchedPath.length)
  const dirPath = path.resolve(process.cwd(), targetPath.slice(0, index + matchedPath.length))
  if (!pathsToParse[dirPath]) {
    pathsToParse[dirPath] = 1
  }
  // TODO: 解析生成对应的index.js
  debouncedGenerateExport(outputPath, watcher)
}

export default function (api, options) {
  const { match, outputPath } = { ...defaultOptions, ...options }
  const watcher = chokidar.watch('.', {
    ignored: /(node_modules|.git|.umi|package.json|.umirc|test|jest|__test__|.prettier|.fatherrc|yarn|npm|.DS_Store|.editorconfig|.md)/, // ignore dotfiles
    persistent: true
  });
  api.onStart(() => {
    watcher
      .on('add', path => parseExport(path, 'add', match, outputPath, watcher))
      .on('change', path => parseExport(path, 'change', match, outputPath, watcher))
      .on('unlink', path => parseExport(path, 'remove', match, outputPath, watcher));
  })
  api.onExit(() => {
    watcher.close().then(() => console.log('closed'));
  })
}
