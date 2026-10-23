# `decode-uri-component` security backport

`index.js` is a CommonJS adaptation of the linear-time malformed UTF-8 decoder in upstream `decode-uri-component` 0.5.0. It is copied into the installed `decode-uri-component@0.2.2` file because Expo Router 57 uses `query-string@7`, which requires the CommonJS package and declares `^0.2.2`.

`npm run postinstall` applies the backport after installs and fails if the expected package version or entry point changes. The registry advisory may continue to include version 0.2.2 because the installed package metadata stays compatible with `query-string` 7. Remove this backport when the Expo Router dependency chain can use the upstream fixed package directly.

The code is distributed under the upstream MIT license in `LICENSE`.
