const baseUrl = process.env.STAGING_API_BASE_URL?.replace(/\/$/, '');
if (!baseUrl) {
  console.error('STAGING_API_BASE_URL is required.');
  process.exit(1);
}

let failed = false;
for (const path of ['/health', '/ready']) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`PASS ${path}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${path}: ${error.message}`);
  }
}
process.exitCode = failed ? 1 : 0;
