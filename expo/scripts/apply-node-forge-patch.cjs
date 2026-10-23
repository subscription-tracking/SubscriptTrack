'use strict';

const fs = require('node:fs');
const path = require('node:path');

const packageJson = require.resolve('node-forge/package.json');
const packageInfo = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
if (packageInfo.version !== '1.4.0') {
  throw new Error(`node-forge patch expects 1.4.0 pending upstream release, found ${packageInfo.version}`);
}

const rsaPath = path.join(path.dirname(packageJson), 'lib', 'rsa.js');
let source = fs.readFileSync(rsaPath, 'utf8');
const vulnerable = [
  '          if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||',
  '            obj.value.length !== 2) {',
].join('\n');
const patched = [
  '          if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||',
  '            obj.value.length !== 2 ||',
  '            obj.value[0].value.length !==',
  "              (('parameters' in capture) ? 2 : 1)) {",
].join('\n');

if (source.includes(patched)) {
  process.exit(0);
}
if (source.split(vulnerable).length !== 2) {
  throw new Error('node-forge RSA verifier does not match the reviewed 1.4.0 patch context');
}

source = source.replace(vulnerable, patched);
fs.writeFileSync(rsaPath, source);
