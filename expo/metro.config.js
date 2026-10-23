const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const enhance = config.server.enhanceMiddleware;

// Windows + Android can stall at 99% while OkHttp reads large multipart dev
// bundles (expo/expo#49111). A normal JS response avoids the multipart reader.
// Keep Expo defaults for every other request.
config.server.enhanceMiddleware = (middleware, server) => {
  const handler = enhance ? enhance(middleware, server) : middleware;
  return (req, res, next) => {
    if (process.platform === 'win32') {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.endsWith('.bundle') && url.searchParams.get('platform') === 'android' && req.headers.accept?.includes('multipart/mixed')) {
        req.headers.accept = 'application/javascript';
      }
    }
    return handler(req, res, next);
  };
};

module.exports = config;
