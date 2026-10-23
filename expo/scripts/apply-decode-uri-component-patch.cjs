'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packagePath = require.resolve('decode-uri-component/package.json');
const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (packageInfo.version !== '0.2.2') {
  throw new Error(`decode-uri-component patch expected 0.2.2, found ${packageInfo.version}`);
}

const entryPath = require.resolve('decode-uri-component');
if (path.basename(entryPath) !== 'index.js' || path.dirname(entryPath) !== path.dirname(packagePath)) {
  throw new Error('decode-uri-component patch found an unexpected package entry point');
}

const patchedEntry = path.join(__dirname, '..', 'patches', 'decode-uri-component', 'index.js');
fs.copyFileSync(patchedEntry, entryPath);
