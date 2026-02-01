// Minimal repro that demonstrates the runtime throw when `next-intl` cannot find a config file.
try {
  const server = require('next-intl/dist/production/server.react-server');
  if (!server || !server.getRequestConfig) {
    console.error('next-intl server module not found in node_modules');
    process.exit(1);
  }

  // Simulate calling getRequestConfig with a function that doesn't return a locale
  (async () => {
    try {
      const getRequestConfig = server.getRequestConfig;
      // Call with a function that returns undefined / no locale
      const result = await getRequestConfig(async ({ locale }) => ({ messages: {} }));
      console.log('Result:', result);
    } catch (err) {
      console.error('Repro caught error:');
      console.error(err && err.message ? err.message : err);
      process.exit(2);
    }
  })();
} catch (err) {
  console.error('Error requiring next-intl server module; is next-intl installed?');
  console.error(err.message || err);
  process.exit(1);
}