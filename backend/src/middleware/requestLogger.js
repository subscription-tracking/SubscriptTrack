export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    // Keep operational logs useful without recording tokens, request bodies,
    // notification tokens, or subscription notes.
    console.log(JSON.stringify({
      level: 'info',
      event: 'http_request',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    }));
  });

  next();
}
