'use strict';

// CommonJS-compatible adaptation of decode-uri-component 0.5.0.
// The upstream release is ESM-only; Expo Router's query-string 7 dependency
// consumes this package with require(). Keep this adapter until the SDK's
// router chain can use the upstream patched release directly.
const token = '%[a-f0-9]{2}';
const multiMatcher = new RegExp(`(${token})+`, 'gi');
const hexPair = /^[a-f\d]{2}$/i;

function parsePercentByte(input, position) {
  if (input.codePointAt(position) !== 37 || position + 3 > input.length) return undefined;
  const digits = input.slice(position + 1, position + 3);
  if (!hexPair.test(digits)) return undefined;
  return { byte: Number.parseInt(digits, 16), next: position + 3 };
}

function utf8SequenceLength(byte) {
  if (byte <= 0x7f) return 1;
  if (byte >= 0xc2 && byte <= 0xdf) return 2;
  if (byte >= 0xe0 && byte <= 0xef) return 3;
  if (byte >= 0xf0 && byte <= 0xf4) return 4;
  return 0;
}

function isContinuationByte(byte) {
  return byte >= 0x80 && byte <= 0xbf;
}

function decode(input) {
  try {
    return decodeURIComponent(input);
  } catch {
    let output = '';
    let position = 0;

    while (position < input.length) {
      if (input.codePointAt(position) !== 37) {
        output += input.charAt(position);
        position++;
        continue;
      }

      const firstByte = parsePercentByte(input, position);
      if (!firstByte) {
        output += input.charAt(position);
        position++;
        continue;
      }

      const sequenceLength = utf8SequenceLength(firstByte.byte);
      if (sequenceLength === 0) {
        output += input.slice(position, position + 3);
        position += 3;
        continue;
      }

      let end = firstByte.next;
      let validSequence = true;
      for (let index = 1; index < sequenceLength; index++) {
        const nextByte = parsePercentByte(input, end);
        if (!nextByte || !isContinuationByte(nextByte.byte)) {
          validSequence = false;
          break;
        }
        end = nextByte.next;
      }

      if (validSequence) {
        try {
          output += decodeURIComponent(input.slice(position, end));
          position = end;
          continue;
        } catch {
          // Preserve this invalid byte and continue scanning in linear time.
        }
      }

      output += input.slice(position, position + 3);
      position += 3;
    }

    return output;
  }
}

function customDecodeURIComponent(input) {
  const replaceMap = {
    '%FE%FF': '\uFFFD\uFFFD',
    '%FF%FE': '\uFFFD\uFFFD',
  };

  let match = multiMatcher.exec(input);
  while (match) {
    try {
      replaceMap[match[0]] = decodeURIComponent(match[0]);
    } catch {
      const result = decode(match[0]);
      if (result !== match[0]) replaceMap[match[0]] = result;
    }
    match = multiMatcher.exec(input);
  }

  replaceMap['%C2'] = '\uFFFD';
  for (const key of Object.keys(replaceMap)) {
    input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
  }
  return input;
}

module.exports = function decodeUriComponent(encodedURI) {
  if (typeof encodedURI !== 'string') {
    throw new TypeError(`Expected \`encodedURI\` to be of type \`string\`, got \`${typeof encodedURI}\``);
  }

  try {
    return decodeURIComponent(encodedURI);
  } catch {
    return customDecodeURIComponent(encodedURI);
  }
};
